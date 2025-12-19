import { Booking, BookingStatus } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { eventBus } from "@/modules/events/eventBus";
import { BookingPromotedEvent } from "./events";

export class BookingService {
  /**
   * Create a booking for a member
   * - confirmed if capacity available
   * - waitlisted if full
   */
  static async createBooking(
    classId: string,
    memberId: string
  ): Promise<Booking> {
    // 1. Check for duplicate active booking
    const { data: existing } = await supabase
      .from('class_bookings')
      .select('id')
      .eq('class_id', classId)
      .eq('member_id', memberId)
      .in('status', ['confirmed', 'waitlisted', 'booked'])
      .maybeSingle();

    if (existing) {
      throw new Error("Member already booked this class");
    }

    // 2. Load class + capacity
    const { data: classItem, error: classError } = await supabase
      .from('classes')
      .select('id, capacity')
      .eq('id', classId)
      .single();

    if (classError || !classItem) {
      throw new Error("Class not found");
    }

    // 3. Count confirmed bookings
    const { count: confirmedCount } = await supabase
      .from('class_bookings')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .in('status', ['confirmed', 'booked']);

    const status: BookingStatus =
      (confirmedCount || 0) < (classItem.capacity || 20)
        ? "booked"
        : "waitlisted";

    // 4. Create booking
    const { data: newBooking, error: insertError } = await supabase
      .from('class_bookings')
      .insert({
        class_id: classId,
        member_id: memberId,
        status
      })
      .select()
      .single();

    if (insertError || !newBooking) {
      throw new Error(insertError?.message || "Failed to create booking");
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
  }

  /**
   * Cancel a booking
   * - If confirmed → promote next waitlisted
   */
  static async cancelBooking(bookingId: string): Promise<void> {
    // Get the booking
    const { data: booking } = await supabase
      .from('class_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.status === 'cancelled') {
      return;
    }

    // 1. Cancel booking
    await supabase
      .from('class_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    // 2. If it was confirmed/booked, promote next waitlisted
    if (booking.status === 'confirmed' || booking.status === 'booked') {
      const { data: next } = await supabase
        .from('class_bookings')
        .select('*')
        .eq('class_id', booking.class_id)
        .eq('status', 'waitlisted')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (next) {
        await supabase
          .from('class_bookings')
          .update({ status: 'booked' })
          .eq('id', next.id);

        // Emit event for notification
        eventBus.emit<BookingPromotedEvent>(
          "booking.promoted",
          {
            bookingId: next.id,
            memberId: next.member_id,
            classId: next.class_id,
          }
        );
      }
    }
  }
}
