import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { updateUserProfileImage, getUserById } from "@/lib/users";
import { uploadProfileImage, deleteProfileImage } from "@/lib/s3";
import { getFriendshipsForUser } from "@/lib/friendships";
import { emitToUser } from "@/lib/socket";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = await uploadProfileImage(
      session.userId,
      buffer,
      file.type
    );

    await updateUserProfileImage(session.userId, imageUrl);

    // Notify friends of profile update
    notifyFriendsOfProfileUpdate(session.userId).catch(console.error);

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Profile image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteProfileImage(session.userId);
    await updateUserProfileImage(session.userId, null);

    // Notify friends of profile update
    notifyFriendsOfProfileUpdate(session.userId).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile image delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}

// Helper function to notify friends of profile updates
async function notifyFriendsOfProfileUpdate(userId: string) {
  const user = await getUserById(userId);
  if (!user) return;

  const friendships = await getFriendshipsForUser(userId);

  for (const friendship of friendships) {
    emitToUser(friendship.friendId, "friend_profile_updated", {
      friendId: userId,
      username: user.username,
      profileImageUrl: user.profileImageUrl,
    });
  }
}
