"use client";

import { useState } from "react";
import { FriendRequestWithUser } from "@/types/friends";

interface FriendRequestCardProps {
  request: FriendRequestWithUser;
  type: "received" | "sent";
  onAccept?: (id: string) => Promise<void>;
  onDecline?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}

export default function FriendRequestCard({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestCardProps) {
  const [loading, setLoading] = useState(false);

  const user = type === "received" ? request.sender : request.receiver;

  const handleAccept = async () => {
    if (!onAccept) return;
    setLoading(true);
    try {
      await onAccept(request.id);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;
    setLoading(true);
    try {
      await onDecline(request.id);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setLoading(true);
    try {
      await onCancel(request.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            className="h-8 w-8 border border-black object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center border border-dashed border-black bg-gray-50">
            <span className="text-xs text-gray-400">?</span>
          </div>
        )}
        <span className="text-sm">@{user?.username || "Unknown"}</span>
      </div>

      <div className="flex gap-1">
        {type === "received" ? (
          <>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="border border-black bg-black px-2 py-1 text-xs text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "..." : "Accept"}
            </button>
            <button
              onClick={handleDecline}
              disabled={loading}
              className="border border-black px-2 py-1 text-xs transition-colors hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? "..." : "Decline"}
            </button>
          </>
        ) : (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="border border-black px-2 py-1 text-xs transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? "..." : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}
