import type { NextApiRequest, NextApiResponse } from "next";
import { BookingService } from "@/modules/booking/bookingService";
import { getSessionUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).end();
  }

  try {
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const bookingId = req.query.id as string;
    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID missing" });
    }

    // Optional: ownership / role check here if needed

    await BookingService.cancelBooking(bookingId);

    return res.status(204).end();
  } catch (err: any) {
    return res.status(400).json({
      error: err.message ?? "Failed to cancel booking"
    });
  }
}
