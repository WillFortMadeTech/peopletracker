export interface FriendPermissions {
  seeLocation: boolean;
  seeActivity: boolean;
  seeFullProfile: boolean;
}

export const DEFAULT_PERMISSIONS: FriendPermissions = {
  seeLocation: false,
  seeActivity: false,
  seeFullProfile: false,
};

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
}

export interface FriendRequestWithUser extends FriendRequest {
  sender?: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
  receiver?: {
    id: string;
    username: string;
    profileImageUrl?: string;
  };
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  permissions: FriendPermissions;
  createdAt: string;
}

export interface FriendWithUser extends Friendship {
  sharedWithMe?: FriendPermissions; // What the friend shares with me
  friend: {
    id: string;
    username: string;
    email?: string;
    profileImageUrl?: string;
  };
}

export type NotificationType = "friend_request_received" | "friend_request_accepted";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  data: {
    fromUserId?: string;
    fromUsername?: string;
    requestId?: string;
    friendshipId?: string;
  };
  read: boolean;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  profileImageUrl?: string;
}
