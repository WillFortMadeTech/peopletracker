import { randomUUID } from "crypto";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamodb";
import { Friendship, FriendPermissions, DEFAULT_PERMISSIONS } from "@/types/friends";

const TABLE_NAME = "Friendships";

export async function createFriendship(
  userId: string,
  friendId: string
): Promise<{ userFriendship: Friendship; friendFriendship: Friendship }> {
  const now = new Date().toISOString();

  const userFriendship: Friendship = {
    id: randomUUID(),
    userId,
    friendId,
    permissions: { ...DEFAULT_PERMISSIONS },
    createdAt: now,
  };

  const friendFriendship: Friendship = {
    id: randomUUID(),
    userId: friendId,
    friendId: userId,
    permissions: { ...DEFAULT_PERMISSIONS },
    createdAt: now,
  };

  await Promise.all([
    docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: userFriendship,
      })
    ),
    docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: friendFriendship,
      })
    ),
  ]);

  return { userFriendship, friendFriendship };
}

export async function getFriendshipById(id: string): Promise<Friendship | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );

  return (response.Item as Friendship) || null;
}

export async function getFriendshipsForUser(userId: string): Promise<Friendship[]> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    })
  );

  return (response.Items as Friendship[]) || [];
}

export async function getFriendshipBetweenUsers(
  userId: string,
  friendId: string
): Promise<Friendship | null> {
  const friendships = await getFriendshipsForUser(userId);
  return friendships.find((f) => f.friendId === friendId) || null;
}

export async function updateFriendshipPermissions(
  id: string,
  permissions: Partial<FriendPermissions>
): Promise<void> {
  const friendship = await getFriendshipById(id);
  if (!friendship) {
    throw new Error("Friendship not found");
  }

  const updatedPermissions = {
    ...friendship.permissions,
    ...permissions,
  };

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET #perms = :permissions",
      ExpressionAttributeNames: {
        "#perms": "permissions",
      },
      ExpressionAttributeValues: {
        ":permissions": updatedPermissions,
      },
    })
  );
}

export async function deleteFriendship(userId: string, friendId: string): Promise<void> {
  const [userFriendship, friendFriendship] = await Promise.all([
    getFriendshipBetweenUsers(userId, friendId),
    getFriendshipBetweenUsers(friendId, userId),
  ]);

  const deletePromises: Promise<unknown>[] = [];

  if (userFriendship) {
    deletePromises.push(
      docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { id: userFriendship.id },
        })
      )
    );
  }

  if (friendFriendship) {
    deletePromises.push(
      docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { id: friendFriendship.id },
        })
      )
    );
  }

  await Promise.all(deletePromises);
}

export async function areFriends(userId: string, friendId: string): Promise<boolean> {
  const friendship = await getFriendshipBetweenUsers(userId, friendId);
  return friendship !== null;
}
