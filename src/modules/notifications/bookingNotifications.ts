import { eventBus } from "@/modules/events/eventBus";
import { BookingPromotedEvent } from "@/modules/booking/events";
import { sendEmail } from "./emailService";
import { db } from "@/lib/db";

eventBus.on<BookingPromotedEvent>(
  "booking.promoted",
  async ({ bookingId, memberId, classId }) => {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        member: true,
        class: true,
      },
    });

    if (!booking) return;

    await sendEmail({
      to: booking.member.email,
      subject: "Vaga confirmada na aula 🎉",
      template: "booking-promoted",
      variables: {
        memberName: booking.member.fullName,
        classTitle: booking.class.title,
        classDate: booking.class.startsAt,
      },
    });
  }
);
