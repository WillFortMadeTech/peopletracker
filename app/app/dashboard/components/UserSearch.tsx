"use client";

import { useState, useEffect, useRef } from "react";
import { PublicUser } from "@/types/friends";

interface UserSearchProps {
  onSendRequest: (userId: string) => Promise<void>;
  sentRequestUserIds: string[];
  friendIds: string[];
}

export default function UserSearch({
  onSendRequest,
  sentRequestUserIds,
  friendIds,
}: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.users);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId);
    try {
      await onSendRequest(userId);
    } finally {
      setSendingTo(null);
    }
  };

  const getButtonState = (userId: string) => {
    if (friendIds.includes(userId)) {
      return { text: "Friends", disabled: true };
    }
    if (sentRequestUserIds.includes(userId)) {
      return { text: "Pending", disabled: true };
    }
    if (sendingTo === userId) {
      return { text: "...", disabled: true };
    }
    return { text: "Add", disabled: false };
  };

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full border-2 border-black px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            ...
          </span>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-2 border-2 border-black">
          {results.map((user) => {
            const { text, disabled } = getButtonState(user.id);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between border-b border-gray-200 px-3 py-2 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt=""
                      className="h-6 w-6 border border-black object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center border border-dashed border-black bg-gray-50">
                      <span className="text-xs text-gray-400">?</span>
                    </div>
                  )}
                  <span className="text-sm">@{user.username}</span>
                </div>
                <button
                  onClick={() => handleSendRequest(user.id)}
                  disabled={disabled}
                  className="border border-black px-2 py-1 text-xs transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {text}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
