"use client";

import { FriendWithUser, FriendPermissions } from "@/types/friends";

interface FriendProfileProps {
  friend: FriendWithUser;
  onClose: () => void;
  onManagePermissions: () => void;
}

const PERMISSION_LABELS: Record<keyof FriendPermissions, string> = {
  seeLocation: "Location",
  seeActivity: "Activity",
  seeFullProfile: "Full Profile",
};

export default function FriendProfile({
  friend,
  onClose,
  onManagePermissions,
}: FriendProfileProps) {
  const sharedWithMe = friend.sharedWithMe;
  const iShareWithThem = friend.permissions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm border-2 border-black bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="font-medium">Friend Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* Profile Info */}
          <div className="mb-6 flex items-center gap-4">
            {friend.friend.profileImageUrl ? (
              <img
                src={friend.friend.profileImageUrl}
                alt=""
                className="h-16 w-16 border-2 border-black object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center border-2 border-dashed border-black bg-gray-50">
                <span className="text-gray-400">?</span>
              </div>
            )}
            <div>
              <p className="text-lg font-medium">@{friend.friend.username}</p>
              {friend.friend.email && (
                <p className="text-sm text-gray-600">{friend.friend.email}</p>
              )}
            </div>
          </div>

          {/* What they share with me */}
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-medium text-gray-700">
              Shares with you
            </h4>
            <div className="flex flex-wrap gap-2">
              {sharedWithMe ? (
                Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                  const isShared = sharedWithMe[key as keyof FriendPermissions];
                  return (
                    <span
                      key={key}
                      className={`border px-2 py-1 text-xs ${
                        isShared
                          ? "border-black bg-black text-white"
                          : "border-gray-300 text-gray-400"
                      }`}
                    >
                      {label}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-gray-400">Nothing shared</span>
              )}
            </div>
          </div>

          {/* What I share with them */}
          <div className="mb-6">
            <h4 className="mb-2 text-sm font-medium text-gray-700">
              You share with them
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                const isShared = iShareWithThem[key as keyof FriendPermissions];
                return (
                  <span
                    key={key}
                    className={`border px-2 py-1 text-xs ${
                      isShared
                        ? "border-black bg-black text-white"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          <button
            onClick={onManagePermissions}
            className="w-full border-2 border-black py-2 text-sm transition-colors hover:bg-black hover:text-white"
          >
            Manage Permissions
          </button>
        </div>
      </div>
    </div>
  );
}
