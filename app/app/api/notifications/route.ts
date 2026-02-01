import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getNotificationsForUser } from "@/lib/notifications";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await getNotificationsForUser(session.userId);

  return NextResponse.json({ notifications });
}
