import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  createFriendRequest,
  getPendingRequestsForUser,
  getSentRequestsByUser,
  getPendingRequestBetweenUsers,
} from "@/lib/friendRequests";
import { areFriends } from "@/lib/friendships";
import { getUserById } from "@/lib/users";
import { createNotification } from "@/lib/notifications";
import { emitToUser } from "@/lib/socket";
import { FriendRequestWithUser } from "@/types/friends";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [received, sent] = await Promise.all([
    getPendingRequestsForUser(session.userId),
    getSentRequestsByUser(session.userId),
  ]);

  const receivedWithUsers: FriendRequestWithUser[] = await Promise.all(
    received.map(async (request) => {
      const sender = await getUserById(request.senderId);
      return {
        ...request,
        sender: sender
          ? {
              id: sender.id,
              username: sender.username || "Unknown",
              profileImageUrl: sender.profileImageUrl,
            }
          : undefined,
      };
    })
  );

  const sentWithUsers: FriendRequestWithUser[] = await Promise.all(
    sent
      .filter((r) => r.status === "pending")
      .map(async (request) => {
        const receiver = await getUserById(request.receiverId);
        return {
          ...request,
          receiver: receiver
            ? {
                id: receiver.id,
                username: receiver.username || "Unknown",
                profileImageUrl: receiver.profileImageUrl,
              }
            : undefined,
        };
      })
  );

  return NextResponse.json({
    received: receivedWithUsers,
    sent: sentWithUsers,
  });
}

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { receiverId } = body;

  if (!receiverId) {
    return NextResponse.json(
      { error: "Receiver ID is required" },
      { status: 400 }
    );
  }

  if (receiverId === session.userId) {
    return NextResponse.json(
      { error: "Cannot send friend request to yourself" },
      { status: 400 }
    );
  }

  const receiver = await getUserById(receiverId);
  if (!receiver) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const alreadyFriends = await areFriends(session.userId, receiverId);
  if (alreadyFriends) {
    return NextResponse.json(
      { error: "Already friends with this user" },
      { status: 400 }
    );
  }

  const existingRequest = await getPendingRequestBetweenUsers(
    session.userId,
    receiverId
  );
  if (existingRequest) {
    return NextResponse.json(
      { error: "Friend request already sent" },
      { status: 400 }
    );
  }

  const reverseRequest = await getPendingRequestBetweenUsers(
    receiverId,
    session.userId
  );
  if (reverseRequest) {
    return NextResponse.json(
      { error: "This user has already sent you a friend request" },
      { status: 400 }
    );
  }

  const sender = await getUserById(session.userId);
  const friendRequest = await createFriendRequest(session.userId, receiverId);

  const notification = await createNotification(
    receiverId,
    "friend_request_received",
    {
      fromUserId: session.userId,
      fromUsername: sender?.username || "Unknown",
      requestId: friendRequest.id,
    }
  );

  emitToUser(receiverId, "notification", notification);

  return NextResponse.json({ request: friendRequest }, { status: 201 });
}
