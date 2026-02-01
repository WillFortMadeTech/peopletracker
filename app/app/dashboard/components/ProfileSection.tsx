"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ProfileSectionProps {
  username: string;
  imageUrl?: string;
}

export default function ProfileSection({
  username,
  imageUrl,
}: ProfileSectionProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/profile/image", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
      setShowMenu(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 border-2 border-black px-3 py-2 transition-colors hover:bg-gray-50"
        disabled={loading}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Profile"
            className="h-8 w-8 border border-black object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center border border-dashed border-black bg-gray-50">
            <span className="text-xs text-gray-400">?</span>
          </div>
        )}
        <span className="text-sm font-medium">@{username}</span>
      </button>

      {showMenu && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 border-2 border-black bg-white shadow-lg">
          <label className="block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-gray-100">
            {loading ? "Uploading..." : "Change Photo"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleUpload}
              disabled={loading}
              className="hidden"
            />
          </label>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? "..." : "Log Out"}
          </button>
        </div>
      )}
    </div>
  );
}
