import { Booking, BookingStatus } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { eventBus } from "@/modules/events/eventBus";
import { BookingPromotedEvent } from "./events";

export class BookingService {
  /**
   * Create a booking for a member
   * - confirmed if capacity available
   * - waitlisted if full
   * 
   * SECURITY: Authorization handled by RLS policies
   */
  static async createBooking(
    classId: string,
    memberId: string,
    gymId: string
  ): Promise<Booking> {
    // Validate inputs
    if (!classId || !memberId || !gymId) {
      throw new Error("Missing required parameters");
    }

    try {
      // 1. Check for duplicate active booking
      const { data: existing, error: existingError } = await supabase
        .from('class_bookings')
        .select('id')
        .eq('class_id', classId)
        .eq('member_id', memberId)
        .in('status', ['confirmed', 'waitlisted', 'booked'])
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        throw new Error("Member already booked this class");
      }

      // 2. Load class + capacity (RLS ensures user can only see their gym's classes)
      const { data: classItem, error: classError } = await supabase
        .from('classes')
        .select('id, capacity, gym_id')
        .eq('id', classId)
        .eq('gym_id', gymId)
        .single();

      if (classError || !classItem) {
        throw new Error("Class not found or access denied");
      }

      // 3. Count confirmed bookings
      const { count: confirmedCount, error: countError } = await supabase
        .from('class_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .in('status', ['confirmed', 'booked']);

      if (countError) throw countError;

      // 4. Determine status based on capacity
      const capacity = classItem.capacity || 20;
      const currentCount = confirmedCount || 0;
      const status: BookingStatus = currentCount < capacity ? "booked" : "waitlisted";

      // 5. Create booking (RLS will validate permissions)
      const { data: newBooking, error: insertError } = await supabase
        .from('class_bookings')
        .insert({
          class_id: classId,
          member_id: memberId,
          status,
          booked_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Booking creation failed:', insertError.message);
        throw new Error("Failed to create booking. Please try again.");
      }

      if (!newBooking) {
        throw new Error("Booking creation failed");
      }

      return {
        id: newBooking.id,
        class_id: newBooking.class_id,
        member_id: newBooking.member_id,
        status: newBooking.status as BookingStatus,
        booked_at: newBooking.booked_at,
        checked_in_at: newBooking.checked_in_at,
        created_at: newBooking.created_at
      };
    } catch (error: any) {
      console.error('Create booking error:', error?.message);
      throw error;
    }
  }

  /**
   * Cancel a booking
   * - If confirmed → promote next waitlisted
   * 
   * SECURITY: RLS ensures users can only cancel their own bookings
   */
  static async cancelBooking(bookingId: string, userId: string): Promise<void> {
    if (!bookingId || !userId) {
      throw new Error("Missing required parameters");
    }

    try {
      // 1. Get the booking (RLS will filter to only user's bookings)
      const { data: booking, error: fetchError } = await supabase
        .from('class_bookings')
        .select('*, member:members!inner(user_id)')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        throw new Error("Booking not found or access denied");
      }

      // 2. Verify ownership
      if (booking.member?.user_id !== userId) {
        throw new Error("Access denied");
      }

      // 3. Check if already cancelled
      if (booking.status === 'cancelled') {
        throw new Error("Booking already cancelled");
      }

      // 4. Cancel booking
      const { error: cancelError } = await supabase
        .from('class_bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (cancelError) throw cancelError;

      // 5. If it was confirmed/booked, promote next waitlisted
      if (booking.status === 'confirmed' || booking.status === 'booked') {
        await this.promoteNextWaitlisted(booking.class_id);
      }
    } catch (error: any) {
      console.error('Cancel booking error:', error?.message);
      throw error;
    }
  }

  /**
   * Promote next waitlisted member to confirmed
   * 
   * PRIVATE METHOD - Called internally after cancellation
   */
  private static async promoteNextWaitlisted(classId: string): Promise<void> {
    try {
      // Get next waitlisted booking
      const { data: next, error: fetchError } = await supabase
        .from('class_bookings')
        .select('*')
        .eq('class_id', classId)
        .eq('status', 'waitlisted')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Failed to fetch waitlisted booking:', fetchError.message);
        return;
      }

      if (!next) return; // No one waiting

      // Promote to booked
      const { error: updateError } = await supabase
        .from('class_bookings')
        .update({ 
          status: 'booked',
          promoted_at: new Date().toISOString()
        })
        .eq('id', next.id);

      if (updateError) {
        console.error('Failed to promote booking:', updateError.message);
        return;
      }

      // Emit event for notification
      eventBus.emit<BookingPromotedEvent>(
        "booking.promoted",
        {
          bookingId: next.id,
          memberId: next.member_id,
          classId: next.class_id,
        }
      );
    } catch (error: any) {
      console.error('Promote waitlisted error:', error?.message);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Check in a member for their booking
   * 
   * SECURITY: Only staff can check in members
   */
  static async checkInBooking(bookingId: string, staffUserId: string): Promise<void> {
    if (!bookingId || !staffUserId) {
      throw new Error("Missing required parameters");
    }

    try {
      // Get booking
      const { data: booking, error: fetchError } = await supabase
        .from('class_bookings')
        .select('id, status, checked_in_at')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        throw new Error("Booking not found");
      }

      // Validate booking status
      if (booking.status === 'cancelled') {
        throw new Error("Cannot check in cancelled booking");
      }

      if (booking.status === 'waitlisted') {
        throw new Error("Cannot check in waitlisted booking");
      }

      if (booking.checked_in_at) {
        throw new Error("Already checked in");
      }

      // Check in
      const { error: updateError } = await supabase
        .from('class_bookings')
        .update({ 
          checked_in_at: new Date().toISOString(),
          status: 'confirmed' // Change from booked to confirmed on check-in
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;
    } catch (error: any) {
      console.error('Check-in error:', error?.message);
      throw error;
    }
  }

  /**
   * Get member's upcoming bookings
   * 
   * SECURITY: RLS filters to only user's bookings
   */
  static async getMemberBookings(memberId: string): Promise<Booking[]> {
    if (!memberId) {
      throw new Error("Member ID required");
    }

    try {
      const { data, error } = await supabase
        .from('class_bookings')
        .select(`
          *,
          class:classes(
            id,
            title,
            start_time,
            end_time,
            capacity,
            location:locations(name)
          )
        `)
        .eq('member_id', memberId)
        .gte('class.start_time', new Date().toISOString())
        .in('status', ['booked', 'confirmed', 'waitlisted'])
        .order('class.start_time', { ascending: true });

      if (error) throw error;

      return (data || []).map(b => ({
        id: b.id,
        class_id: b.class_id,
        member_id: b.member_id,
        status: b.status as BookingStatus,
        booked_at: b.booked_at,
        checked_in_at: b.checked_in_at,
        created_at: b.created_at
      }));
    } catch (error: any) {
      console.error('Get bookings error:', error?.message);
      throw error;
    }
  }

  /**
   * Get class bookings (for staff/admin view)
   * 
   * SECURITY: RLS filters to user's gym only
   */
  static async getClassBookings(classId: string): Promise<Booking[]> {
    if (!classId) {
      throw new Error("Class ID required");
    }

    try {
      const { data, error } = await supabase
        .from('class_bookings')
        .select(`
          *,
          member:members(id, full_name, email)
        `)
        .eq('class_id', classId)
        .in('status', ['booked', 'confirmed', 'waitlisted'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(b => ({
        id: b.id,
        class_id: b.class_id,
        member_id: b.member_id,
        status: b.status as BookingStatus,
        booked_at: b.booked_at,
        checked_in_at: b.checked_in_at,
        created_at: b.created_at
      }));
    } catch (error: any) {
      console.error('Get class bookings error:', error?.message);
      throw error;
    }
  }
}
