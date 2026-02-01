import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getFriendRequestById, deleteFriendRequest } from "@/lib/friendRequests";
import { emitToUser } from "@/lib/socket";

export async function DELETE(
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

  if (friendRequest.senderId !== session.userId) {
    return NextResponse.json(
      { error: "Can only cancel your own requests" },
      { status: 403 }
    );
  }

  if (friendRequest.status !== "pending") {
    return NextResponse.json(
      { error: "Can only cancel pending requests" },
      { status: 400 }
    );
  }

  await deleteFriendRequest(id);

  // Notify the receiver that the request was cancelled
  emitToUser(friendRequest.receiverId, "friend_request_cancelled", {
    requestId: id,
    byUserId: session.userId,
  });

  return NextResponse.json({ success: true });
}
