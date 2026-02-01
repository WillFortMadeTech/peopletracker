"use client";

import { useState } from "react";
import { FriendPermissions as Permissions } from "@/types/friends";

interface FriendPermissionsProps {
  friendId: string;
  permissions: Permissions;
  onUpdate: (permissions: Partial<Permissions>) => Promise<void>;
  onClose: () => void;
}

const PERMISSION_LABELS: Record<keyof Permissions, string> = {
  seeLocation: "See Location",
  seeActivity: "See Activity",
  seeFullProfile: "See Full Profile",
};

export default function FriendPermissions({
  permissions,
  onUpdate,
  onClose,
}: FriendPermissionsProps) {
  const [localPermissions, setLocalPermissions] =
    useState<Permissions>(permissions);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (key: keyof Permissions) => {
    const newValue = !localPermissions[key];
    setLocalPermissions((prev) => ({ ...prev, [key]: newValue }));

    setSaving(true);
    try {
      await onUpdate({ [key]: newValue });
    } catch {
      setLocalPermissions((prev) => ({ ...prev, [key]: !newValue }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm border-2 border-black bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">Permissions</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
            disabled={saving}
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

        <p className="mb-4 text-xs text-gray-500">
          Control what this friend can see about you
        </p>

        <div className="space-y-3">
          {(Object.keys(PERMISSION_LABELS) as (keyof Permissions)[]).map(
            (key) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between"
              >
                <span className="text-sm">{PERMISSION_LABELS[key]}</span>
                <button
                  onClick={() => handleToggle(key)}
                  disabled={saving}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    localPermissions[key] ? "bg-black" : "bg-gray-300"
                  } ${saving ? "opacity-50" : ""}`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      localPermissions[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>
            )
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full border-2 border-black py-2 text-sm transition-colors hover:bg-black hover:text-white"
        >
          Done
        </button>
      </div>
    </div>
  );
}
