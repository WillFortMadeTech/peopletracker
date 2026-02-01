import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getFriendshipBetweenUsers, deleteFriendship } from "@/lib/friendships";
import { getUserById } from "@/lib/users";
import { emitToUser } from "@/lib/socket";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendId } = await params;
  const friendship = await getFriendshipBetweenUsers(session.userId, friendId);

  if (!friendship) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  const friend = await getUserById(friendId);

  return NextResponse.json({
    friendship: {
      ...friendship,
      friend: {
        id: friendId,
        username: friend?.username || "Unknown",
        profileImageUrl: friend?.profileImageUrl,
        email: friendship.permissions.seeEmail ? friend?.email : undefined,
      },
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendId } = await params;
  const friendship = await getFriendshipBetweenUsers(session.userId, friendId);

  if (!friendship) {
    return NextResponse.json({ error: "Friend not found" }, { status: 404 });
  }

  await deleteFriendship(session.userId, friendId);

  // Notify the removed friend via WebSocket
  emitToUser(friendId, "friend_removed", {
    byUserId: session.userId,
  });

  return NextResponse.json({ success: true });
}
