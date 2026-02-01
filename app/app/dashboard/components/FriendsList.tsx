"use client";

import { FriendWithUser, FriendPermissions } from "@/types/friends";
import FriendCard from "./FriendCard";

interface FriendsListProps {
  friends: FriendWithUser[];
  onUpdatePermissions: (
    friendId: string,
    permissions: Partial<FriendPermissions>
  ) => Promise<void>;
  onRemove: (friendId: string) => Promise<void>;
}

export default function FriendsList({
  friends,
  onUpdatePermissions,
  onRemove,
}: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 px-4 py-8 text-center">
        <p className="text-sm text-gray-500">No friends yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Search for users to add friends
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-black">
      {friends.map((friend) => (
        <FriendCard
          key={friend.id}
          friend={friend}
          onUpdatePermissions={onUpdatePermissions}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
