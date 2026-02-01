import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  getFriendshipBetweenUsers,
  updateFriendshipPermissions,
  getFriendshipById,
} from "@/lib/friendships";
import { FriendPermissions } from "@/types/friends";
import { emitToUser } from "@/lib/socket";

export async function PATCH(
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

  const body = await request.json();
  const permissions: Partial<FriendPermissions> = {};

  if (typeof body.seeLocation === "boolean") {
    permissions.seeLocation = body.seeLocation;
  }
  if (typeof body.seeActivity === "boolean") {
    permissions.seeActivity = body.seeActivity;
  }
  if (typeof body.seeFullProfile === "boolean") {
    permissions.seeFullProfile = body.seeFullProfile;
  }

  await updateFriendshipPermissions(friendship.id, permissions);

  // Get updated friendship and notify the friend
  const updatedFriendship = await getFriendshipById(friendship.id);
  emitToUser(friendId, "permissions_updated", {
    friendId: session.userId,
    permissions: updatedFriendship?.permissions,
  });

  return NextResponse.json({ success: true });
}
