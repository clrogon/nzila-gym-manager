export type BookingStatus = "confirmed" | "waitlisted" | "cancelled" | "booked";

export interface Booking {
  id: string;
  class_id: string;
  member_id: string;
  status: BookingStatus;
  booked_at: string;
  checked_in_at: string | null;
  created_at: string;
}

export interface MemberBooking {
  id: string;
  classId: string;
  status: BookingStatus;
}
