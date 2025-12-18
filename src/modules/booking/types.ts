export type BookingStatus = "confirmed" | "waitlisted" | "cancelled";

export interface MemberBooking {
  id: string;
  classId: string;
  status: BookingStatus;
}
