import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { updateUsername, getUserByUsername, getUserById } from "@/lib/users";
import { getFriendshipsForUser } from "@/lib/friendships";
import { emitToUser } from "@/lib/socket";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await request.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-20 characters and contain only letters, numbers, and underscores",
        },
        { status: 400 }
      );
    }

    await updateUsername(session.userId, username);

    // Notify friends of profile update
    notifyFriendsOfProfileUpdate(session.userId, username).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Username already taken") {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    console.error("Username update error:", error);
    return NextResponse.json(
      { error: "Failed to update username" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username parameter required" },
        { status: 400 }
      );
    }

    const existingUser = await getUserByUsername(username);

    return NextResponse.json({ available: !existingUser });
  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json(
      { error: "Failed to check username" },
      { status: 500 }
    );
  }
}

// Helper function to notify friends of profile updates
async function notifyFriendsOfProfileUpdate(userId: string, newUsername: string) {
  const user = await getUserById(userId);
  if (!user) return;

  const friendships = await getFriendshipsForUser(userId);

  for (const friendship of friendships) {
    emitToUser(friendship.friendId, "friend_profile_updated", {
      friendId: userId,
      username: newUsername,
      profileImageUrl: user.profileImageUrl,
    });
  }
}
