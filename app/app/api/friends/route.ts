import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getFriendshipsForUser, getFriendshipBetweenUsers } from "@/lib/friendships";
import { getUserById } from "@/lib/users";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friendships = await getFriendshipsForUser(session.userId);

  const friends = await Promise.all(
    friendships.map(async (friendship) => {
      const friend = await getUserById(friendship.friendId);
      // Get what the friend shares with us (their permissions for us)
      const theirFriendship = await getFriendshipBetweenUsers(
        friendship.friendId,
        session.userId
      );
      const sharedWithMe = theirFriendship?.permissions;

      // Only return fields the friend has explicitly shared
      return {
        id: friendship.id,
        friendId: friendship.friendId,
        permissions: friendship.permissions, // What I share with them
        createdAt: friendship.createdAt,
        sharedWithMe, // What they share with me
        friend: {
          id: friendship.friendId,
          username: friend?.username || "Unknown",
          profileImageUrl: friend?.profileImageUrl,
          // Only include email if they share full profile
          ...(sharedWithMe?.seeFullProfile && friend?.email
            ? { email: friend.email }
            : {}),
        },
      };
    })
  );

  return NextResponse.json({ friends });
}
