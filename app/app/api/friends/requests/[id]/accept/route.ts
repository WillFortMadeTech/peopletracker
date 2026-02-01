import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  getFriendRequestById,
  updateFriendRequestStatus,
} from "@/lib/friendRequests";
import { createFriendship } from "@/lib/friendships";
import { createNotification } from "@/lib/notifications";
import { getUserById } from "@/lib/users";
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
      { error: "Can only accept requests sent to you" },
      { status: 403 }
    );
  }

  if (friendRequest.status !== "pending") {
    return NextResponse.json(
      { error: "Request is no longer pending" },
      { status: 400 }
    );
  }

  await updateFriendRequestStatus(id, "accepted");
  const { userFriendship, friendFriendship } = await createFriendship(
    session.userId,
    friendRequest.senderId
  );

  const accepter = await getUserById(session.userId);
  const notification = await createNotification(
    friendRequest.senderId,
    "friend_request_accepted",
    {
      fromUserId: session.userId,
      fromUsername: accepter?.username || "Unknown",
      friendshipId: friendFriendship.id,
    }
  );

  emitToUser(friendRequest.senderId, "notification", notification);
  emitToUser(friendRequest.senderId, "friend_added", {
    friendshipId: friendFriendship.id,
    friendId: session.userId,
  });

  // Also notify the accepter so their friend list updates
  emitToUser(session.userId, "friend_added", {
    friendshipId: userFriendship.id,
    friendId: friendRequest.senderId,
  });

  return NextResponse.json({
    success: true,
    friendship: userFriendship,
  });
}
