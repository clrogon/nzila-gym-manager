import { eventBus } from "@/modules/events/eventBus";
import { BookingPromotedEvent } from "@/modules/booking/events";
import { supabase } from "@/integrations/supabase/client";

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

      // Call edge function to send email (if implemented)
      // For now, just log the notification
      console.log('Booking promoted notification:', {
        to: member.email,
        memberName: member.full_name,
        classTitle: classInfo.title,
        classDate: classInfo.start_time,
      });

      // TODO: Implement edge function for sending emails
      // await supabase.functions.invoke('send-booking-notification', {
      //   body: {
      //     to: member.email,
      //     template: 'booking-promoted',
      //     variables: {
      //       memberName: member.full_name,
      //       classTitle: classInfo.title,
      //       classDate: classInfo.start_time,
      //     },
      //   },
      // });
    } catch (error) {
      console.error('Failed to send booking promotion notification:', error);
    }
  }
);
