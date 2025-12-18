import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).end();

  const classes = await db.class.findMany({
    where: {
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    include: {
      bookings: {
        where: {
          memberId: user.id,
          status: { in: ["confirmed", "waitlisted"] },
        },
        take: 1,
      },
    },
  });

  const result = classes.map((c) => ({
    id: c.id,
    title: c.title,
    startsAt: c.startsAt,
    capacity: c.capacity,
    booking: c.bookings[0]
      ? {
          id: c.bookings[0].id,
          status: c.bookings[0].status,
        }
      : null,
  }));

  res.json(result);
}
