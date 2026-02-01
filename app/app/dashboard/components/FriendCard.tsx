"use client";

import { useState } from "react";
import { FriendWithUser, FriendPermissions } from "@/types/friends";
import FriendPermissionsModal from "./FriendPermissions";
import FriendProfile from "./FriendProfile";

interface FriendCardProps {
  friend: FriendWithUser;
  onUpdatePermissions: (
    friendId: string,
    permissions: Partial<FriendPermissions>
  ) => Promise<void>;
  onRemove: (friendId: string) => Promise<void>;
}

export default function FriendCard({
  friend,
  onUpdatePermissions,
  onRemove,
}: FriendCardProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm("Remove this friend?")) return;
    setRemoving(true);
    try {
      await onRemove(friend.friendId);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 last:border-b-0">
        <button
          onClick={() => setShowProfile(true)}
          className="flex flex-1 items-center gap-2 text-left hover:opacity-80"
        >
          {friend.friend.profileImageUrl ? (
            <img
              src={friend.friend.profileImageUrl}
              alt=""
              className="h-8 w-8 border border-black object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center border border-dashed border-black bg-gray-50">
              <span className="text-xs text-gray-400">?</span>
            </div>
          )}
          <div>
            <span className="text-sm">@{friend.friend.username}</span>
            {friend.friend.email && (
              <p className="text-xs text-gray-500">{friend.friend.email}</p>
            )}
          </div>
        </button>

        <div className="flex gap-1">
          <button
            onClick={handleRemove}
            disabled={removing}
            className="border border-black px-2 py-1 text-xs transition-colors hover:bg-gray-100 disabled:opacity-50"
            title="Remove"
          >
            {removing ? (
              "..."
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {showProfile && (
        <FriendProfile
          friend={friend}
          onClose={() => setShowProfile(false)}
          onManagePermissions={() => {
            setShowProfile(false);
            setShowPermissions(true);
          }}
        />
      )}

      {showPermissions && (
        <FriendPermissionsModal
          friendId={friend.friendId}
          permissions={friend.permissions}
          onUpdate={(perms) => onUpdatePermissions(friend.friendId, perms)}
          onClose={() => setShowPermissions(false)}
        />
      )}
    </>
  );
}
