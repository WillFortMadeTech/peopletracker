import { randomUUID } from "crypto";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamodb";
import { PublicUser } from "@/types/friends";
import { hashPassword } from "./auth";

const USERS_TABLE = "Users";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  profileImageUrl?: string;
  username?: string;
}

export async function createUser(
  email: string,
  password: string
): Promise<User> {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  const user: User = {
    id: randomUUID(),
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
    })
  );

  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email.toLowerCase(),
      },
    })
  );

  if (!response.Items || response.Items.length === 0) {
    return null;
  }

  return response.Items[0] as User;
}

export async function getUserById(id: string): Promise<User | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { id },
    })
  );

  if (!response.Item) {
    return null;
  }

  return response.Item as User;
}

export async function updateUserProfileImage(
  userId: string,
  profileImageUrl: string | null
): Promise<void> {
  if (profileImageUrl) {
    await docClient.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "SET profileImageUrl = :url",
        ExpressionAttributeValues: {
          ":url": profileImageUrl,
        },
      })
    );
  } else {
    await docClient.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: "REMOVE profileImageUrl",
      })
    );
  }
}

export async function getUserByUsername(
  username: string
): Promise<User | null> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "username-index",
      KeyConditionExpression: "username = :username",
      ExpressionAttributeValues: {
        ":username": username.toLowerCase(),
      },
    })
  );

  if (!response.Items || response.Items.length === 0) {
    return null;
  }

  return response.Items[0] as User;
}

export async function updateUsername(
  userId: string,
  username: string
): Promise<void> {
  const existingUser = await getUserByUsername(username);
  if (existingUser && existingUser.id !== userId) {
    throw new Error("Username already taken");
  }

  await docClient.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: "SET username = :username",
      ExpressionAttributeValues: {
        ":username": username.toLowerCase(),
      },
    })
  );
}

export async function searchUsersByUsername(
  query: string,
  excludeUserId?: string,
  limit: number = 10
): Promise<PublicUser[]> {
  const response = await docClient.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: "contains(username, :query)",
      ExpressionAttributeValues: {
        ":query": query.toLowerCase(),
      },
    })
  );

  if (!response.Items) {
    return [];
  }

  const users = response.Items as User[];
  return users
    .filter((u) => u.username && u.id !== excludeUserId)
    .slice(0, limit)
    .map((u) => ({
      id: u.id,
      username: u.username!,
      profileImageUrl: u.profileImageUrl,
    }));
}
