import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/bearerAuth";
import { createLocation, getLocationsByUser } from "@/lib/locations";
import { getFriendshipsForUser, getFriendshipBetweenUsers } from "@/lib/friendships";
import { getUserById } from "@/lib/users";
import { emitToUser } from "@/lib/socket";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyBearerToken(request.headers.get("authorization"));

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { latitude, longitude, accuracy, altitude, speed, bearing, deviceId } = body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: "Latitude must be between -90 and 90" },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: "Longitude must be between -180 and 180" },
        { status: 400 }
      );
    }

    const location = await createLocation({
      userId: auth.userId,
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      bearing,
      deviceId,
    });

    // Notify friends who can see this user's location via WebSocket
    notifyFriendsOfLocationUpdate(auth.userId, location).catch((err) => {
      console.error("Failed to notify friends of location update:", err);
    });

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error("Location save error:", error);
    return NextResponse.json(
      { error: "Failed to save location" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyBearerToken(request.headers.get("authorization"));

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const locations = await getLocationsByUser(auth.userId, Math.min(limit, 1000));

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Location fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// Helper function to notify friends of location updates
async function notifyFriendsOfLocationUpdate(
  userId: string,
  location: { latitude: number; longitude: number; accuracy?: number; timestamp: string }
) {
  // Get user info for the notification
  const user = await getUserById(userId);
  if (!user) return;

  // Get all friendships where this user is involved
  const friendships = await getFriendshipsForUser(userId);

  for (const friendship of friendships) {
    // Check if this user shares their location with this friend
    // (our permissions = what we share with them)
    if (friendship.permissions.seeLocation) {
      // Emit location update to the friend
      emitToUser(friendship.friendId, "location_update", {
        friendId: userId,
        username: user.username || "Unknown",
        profileImageUrl: user.profileImageUrl,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        },
      });
    }
  }
}
