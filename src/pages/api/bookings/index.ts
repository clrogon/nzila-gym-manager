import type { NextApiRequest, NextApiResponse } from "next";
import { BookingService } from "@/modules/booking/bookingService";
import { getSessionUser } from "@/lib/auth"; // your auth helper

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { classId } = req.body;
    if (!classId) {
      return res.status(400).json({ error: "classId is required" });
    }

    const booking = await BookingService.createBooking(
      classId,
      user.id
    );

    return res.status(201).json(booking);
  } catch (err: any) {
    return res.status(400).json({
      error: err.message ?? "Failed to create booking"
    });
  }
}
