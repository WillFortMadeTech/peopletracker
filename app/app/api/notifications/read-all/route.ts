import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/lib/notifications";

export async function POST() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllNotificationsAsRead(session.userId);

  return NextResponse.json({ success: true });
}
