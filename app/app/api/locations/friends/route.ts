import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getFriendshipsForUser, getFriendshipBetweenUsers } from "@/lib/friendships";
import { getLocationsByUser } from "@/lib/locations";
import { getUserById } from "@/lib/users";
import { Location } from "@/lib/locations";

export interface FriendLocation {
  friendId: string;
  username: string;
  profileImageUrl?: string;
  location: Location | null;
}

export async function GET() {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get my friendships
    const myFriendships = await getFriendshipsForUser(session.userId);

    // For each friend, check if they share location with me
    const friendLocations: FriendLocation[] = [];

    for (const friendship of myFriendships) {
      // Get the reverse friendship to see what they share with me
      const theirFriendship = await getFriendshipBetweenUsers(
        friendship.friendId,
        session.userId
      );

      // If they share location with me
      if (theirFriendship?.permissions.seeLocation) {
        const friend = await getUserById(friendship.friendId);
        if (friend) {
          // Get their latest location
          const locations = await getLocationsByUser(friendship.friendId, 1);

          friendLocations.push({
            friendId: friendship.friendId,
            username: friend.username || "Unknown",
            profileImageUrl: friend.profileImageUrl,
            location: locations[0] || null,
          });
        }
      }
    }

    return NextResponse.json({ friendLocations });
  } catch (error) {
    console.error("Friend locations fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch friend locations" },
      { status: 500 }
    );
  }
}
