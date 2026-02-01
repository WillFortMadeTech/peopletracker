import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getNotificationById, markNotificationAsRead } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notification = await getNotificationById(id);

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  if (notification.userId !== session.userId) {
    return NextResponse.json(
      { error: "Not your notification" },
      { status: 403 }
    );
  }

  await markNotificationAsRead(id);

  return NextResponse.json({ success: true });
}
