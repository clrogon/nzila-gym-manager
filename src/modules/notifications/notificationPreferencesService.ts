import { db } from "@/lib/db";

export async function isNotificationEnabled(
  memberId: string,
  event: string,
  channel: "email" | "push" | "sms"
): Promise<boolean> {
  const pref = await db.notificationPreference.findUnique({
    where: {
      member_id_event_channel: {
        member_id: memberId,
        event,
        channel,
      },
    },
  });

  // default: enabled
  return pref ? pref.enabled : true;
}
