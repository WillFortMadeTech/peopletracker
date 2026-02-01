"use client";

import { FriendRequestWithUser } from "@/types/friends";
import FriendRequestCard from "./FriendRequestCard";

interface FriendRequestsProps {
  received: FriendRequestWithUser[];
  sent: FriendRequestWithUser[];
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export default function FriendRequests({
  received,
  sent,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestsProps) {
  if (received.length === 0 && sent.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {received.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium">
            Received ({received.length})
          </h3>
          <div className="border-2 border-black">
            {received.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                type="received"
                onAccept={onAccept}
                onDecline={onDecline}
              />
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium">Sent ({sent.length})</h3>
          <div className="border-2 border-black">
            {sent.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                type="sent"
                onCancel={onCancel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
