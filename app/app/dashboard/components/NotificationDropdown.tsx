"use client";

import { Notification } from "@/types/friends";

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRequestAction: () => void;
}

export default function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onRequestAction,
}: NotificationDropdownProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "friend_request_received":
        return `@${notification.data.fromUsername} sent you a friend request`;
      case "friend_request_accepted":
        return `@${notification.data.fromUsername} accepted your friend request`;
      default:
        return "New notification";
    }
  };

  const handleClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.type === "friend_request_received") {
      onRequestAction();
    }
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-72 border-2 border-black bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="text-sm font-medium">Notifications</span>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-gray-500 hover:text-black"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.slice(0, 20).map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={`w-full border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50 ${
                !notification.read ? "bg-gray-50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm">{getNotificationText(notification)}</p>
                {!notification.read && (
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-black" />
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formatTime(notification.createdAt)}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
