import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  getFriendRequestById,
  updateFriendRequestStatus,
} from "@/lib/friendRequests";
import { emitToUser } from "@/lib/socket";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const friendRequest = await getFriendRequestById(id);

  if (!friendRequest) {
    return NextResponse.json(
      { error: "Friend request not found" },
      { status: 404 }
    );
  }

  if (friendRequest.receiverId !== session.userId) {
    return NextResponse.json(
      { error: "Can only decline requests sent to you" },
      { status: 403 }
    );
  }

  if (friendRequest.status !== "pending") {
    return NextResponse.json(
      { error: "Request is no longer pending" },
      { status: 400 }
    );
  }

  await updateFriendRequestStatus(id, "declined");

  // Notify the sender that their request was declined
  emitToUser(friendRequest.senderId, "friend_request_declined", {
    requestId: id,
    byUserId: session.userId,
  });

  return NextResponse.json({ success: true });
}
