import { eventBus } from "@/modules/events/eventBus";
import { BookingPromotedEvent } from "@/modules/booking/events";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "./emailService";

// Listen for booking promotions and trigger email notifications via Edge Function
eventBus.on<BookingPromotedEvent>(
  "booking.promoted",
  async ({ bookingId, memberId, classId }) => {
    try {
      // Get booking details
      const { data: booking } = await supabase
        .from('class_bookings')
        .select(`
          id,
          member:members(full_name, email),
          class:classes(title, start_time)
        `)
        .eq('id', bookingId)
        .single();

      if (!booking || !booking.member || !booking.class) {
        console.log('Booking details not found for notification');
        return;
      }

      const member = booking.member as { full_name: string; email: string | null };
      const classInfo = booking.class as { title: string; start_time: string };

      if (!member.email) {
        console.log('Member has no email address');
        return;
      }

      // Send email notification via the centralized email service
      await sendEmail({
        to: member.email,
        subject: `Sua reserva para ${classInfo.title} foi confirmada!`,
        template: 'booking-promoted',
        variables: {
          memberName: member.full_name,
          classTitle: classInfo.title,
          classDate: classInfo.start_time,
        },
      });
    } catch (error) {
      console.error('Failed to send booking promotion notification:', error);
    }
  }
);
