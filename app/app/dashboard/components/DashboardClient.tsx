"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSocketContext } from "./SocketProvider";
import ProfileSection from "./ProfileSection";
import NotificationBell from "./NotificationBell";
import UserSearch from "./UserSearch";
import FriendRequests from "./FriendRequests";
import FriendsList from "./FriendsList";
import LocationMap from "./LocationMap";
import {
  FriendRequestWithUser,
  FriendWithUser,
  FriendPermissions,
} from "@/types/friends";

interface DashboardClientProps {
  user: {
    username: string;
    profileImageUrl?: string;
  };
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [friends, setFriends] = useState<FriendWithUser[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<
    FriendRequestWithUser[]
  >([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { on } = useSocketContext();

  const fetchData = useCallback(async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/requests"),
      ]);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends);
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setReceivedRequests(data.received);
        setSentRequests(data.sent);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const unsubFriendAdded = on("friend_added", () => {
      console.log("[Dashboard] Friend added event received");
      fetchData();
    });

    const unsubPermissions = on("permissions_updated", () => {
      console.log("[Dashboard] Permissions updated event received");
      fetchData();
    });

    const unsubFriendRemoved = on("friend_removed", (data: { byUserId: string }) => {
      console.log("[Dashboard] Friend removed event received:", data);
      // Remove the friend from the local state immediately
      setFriends((prev) => prev.filter((f) => f.friendId !== data.byUserId));
    });

    const unsubRequestDeclined = on("friend_request_declined", (data: { requestId: string }) => {
      console.log("[Dashboard] Friend request declined event received:", data);
      // Remove the declined request from sent requests
      setSentRequests((prev) => prev.filter((r) => r.id !== data.requestId));
    });

    const unsubRequestCancelled = on("friend_request_cancelled", (data: { requestId: string }) => {
      console.log("[Dashboard] Friend request cancelled event received:", data);
      // Remove the cancelled request from received requests
      setReceivedRequests((prev) => prev.filter((r) => r.id !== data.requestId));
    });

    const unsubProfileUpdated = on("friend_profile_updated", (data: { friendId: string; username: string; profileImageUrl?: string }) => {
      console.log("[Dashboard] Friend profile updated event received:", data);
      // Update the friend's info in the local state
      setFriends((prev) =>
        prev.map((f) =>
          f.friendId === data.friendId
            ? {
                ...f,
                friend: {
                  ...f.friend,
                  username: data.username,
                  profileImageUrl: data.profileImageUrl,
                },
              }
            : f
        )
      );
    });

    // Listen for new notifications to update friend requests in real-time
    const unsubNotification = on("notification", (data: { type: string }) => {
      console.log("[Dashboard] Notification received:", data);
      if (data.type === "friend_request_received") {
        // Refresh friend requests when we receive a new friend request
        fetchData();
      }
    });

    return () => {
      unsubFriendAdded();
      unsubPermissions();
      unsubFriendRemoved();
      unsubRequestDeclined();
      unsubRequestCancelled();
      unsubProfileUpdated();
      unsubNotification();
    };
  }, [on, fetchData]);

  const handleSendRequest = async (receiverId: string) => {
    const res = await fetch("/api/friends/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId }),
    });

    if (res.ok) {
      await fetchData();
    }
  };

  const handleAcceptRequest = async (id: string) => {
    const res = await fetch(`/api/friends/requests/${id}/accept`, {
      method: "POST",
    });

    if (res.ok) {
      await fetchData();
    }
  };

  const handleDeclineRequest = async (id: string) => {
    const res = await fetch(`/api/friends/requests/${id}/decline`, {
      method: "POST",
    });

    if (res.ok) {
      setReceivedRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleCancelRequest = async (id: string) => {
    const res = await fetch(`/api/friends/requests/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setSentRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleUpdatePermissions = async (
    friendId: string,
    permissions: Partial<FriendPermissions>
  ) => {
    await fetch(`/api/friends/${friendId}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(permissions),
    });
  };

  const handleRemoveFriend = async (friendId: string) => {
    const res = await fetch(`/api/friends/${friendId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setFriends((prev) => prev.filter((f) => f.friendId !== friendId));
    }
  };

  const sentRequestUserIds = sentRequests.map((r) => r.receiverId);
  const friendIds = friends.map((f) => f.friendId);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-2 border-black">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <ProfileSection
            username={user.username}
            imageUrl={user.profileImageUrl}
          />
          <h1 className="text-xl font-semibold">PeopleTracker</h1>
          <NotificationBell onRequestAction={fetchData} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Map Section */}
            <section>
              <h2 className="mb-3 text-lg font-medium">Location Map</h2>
              <LocationMap currentUsername={user.username} />
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <section>
                  <h2 className="mb-3 text-lg font-medium">Search Users</h2>
                  <UserSearch
                    onSendRequest={handleSendRequest}
                    sentRequestUserIds={sentRequestUserIds}
                    friendIds={friendIds}
                  />
                </section>

                {(receivedRequests.length > 0 || sentRequests.length > 0) && (
                  <section>
                    <h2 className="mb-3 text-lg font-medium">Friend Requests</h2>
                    <FriendRequests
                      received={receivedRequests}
                      sent={sentRequests}
                      onAccept={handleAcceptRequest}
                      onDecline={handleDeclineRequest}
                      onCancel={handleCancelRequest}
                    />
                  </section>
                )}
              </div>

              <section>
                <h2 className="mb-3 text-lg font-medium">
                  Friends ({friends.length})
                </h2>
                <FriendsList
                  friends={friends}
                  onUpdatePermissions={handleUpdatePermissions}
                  onRemove={handleRemoveFriend}
                />
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
