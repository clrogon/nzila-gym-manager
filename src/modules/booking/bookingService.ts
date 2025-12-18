import { Booking, BookingStatus } from "./types";
import { db } from "@/lib/db"; // your DB abstraction

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
    return db.transaction(async (tx) => {
      // 1. Prevent duplicate active booking
      const existing = await tx.booking.findFirst({
        where: {
          classId,
          memberId,
          status: { in: ["confirmed", "waitlisted"] }
        }
      });

      if (existing) {
        throw new Error("Member already booked this class");
      }

      // 2. Load class + capacity
      const classItem = await tx.class.findUnique({
        where: { id: classId }
      });

      if (!classItem) {
        throw new Error("Class not found");
      }

      // 3. Count confirmed bookings
      const confirmedCount = await tx.booking.count({
        where: {
          classId,
          status: "confirmed"
        }
      });

      const status: BookingStatus =
        confirmedCount < classItem.capacity
          ? "confirmed"
          : "waitlisted";

      // 4. Create booking
      return tx.booking.create({
        data: {
          classId,
          memberId,
          status
        }
      });
    });
  }

  /**
   * Cancel a booking
   * - If confirmed → promote next waitlisted
   */
  static async cancelBooking(bookingId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking || booking.status === "cancelled") {
        return;
      }

      // 1. Cancel booking
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "cancelled" }
      });

      // 2. If it was confirmed, promote next waitlisted
      if (booking.status === "confirmed") {
        const next = await tx.booking.findFirst({
          where: {
            classId: booking.classId,
            status: "waitlisted"
          },
          orderBy: { createdAt: "asc" }
        });

        if (next) {
          await tx.booking.update({
            where: { id: next.id },
            data: {
              status: "confirmed",
              promotedAt: new Date()
            }
          });

          // EVENT HOOK (email later)
          // emit("booking.promoted", next)
        }
      }
    });
  }
}
