import { randomUUID } from "crypto";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamodb";
import { Notification, NotificationType } from "@/types/friends";

const TABLE_NAME = "Notifications";

export async function createNotification(
  userId: string,
  type: NotificationType,
  data: Notification["data"]
): Promise<Notification> {
  const notification: Notification = {
    id: randomUUID(),
    userId,
    type,
    data,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: notification,
    })
  );

  return notification;
}

export async function getNotificationById(id: string): Promise<Notification | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );

  return (response.Item as Notification) || null;
}

export async function getNotificationsForUser(
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "userId-createdAt-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );

  return (response.Items as Notification[]) || [];
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const notifications = await getNotificationsForUser(userId);
  return notifications.filter((n) => !n.read).length;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET #read = :read",
      ExpressionAttributeNames: {
        "#read": "read",
      },
      ExpressionAttributeValues: {
        ":read": true,
      },
    })
  );
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notifications = await getNotificationsForUser(userId);
  const unreadNotifications = notifications.filter((n) => !n.read);

  if (unreadNotifications.length === 0) {
    return;
  }

  const batches: Notification[][] = [];
  for (let i = 0; i < unreadNotifications.length; i += 25) {
    batches.push(unreadNotifications.slice(i, i + 25));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map((notification) =>
        docClient.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id: notification.id },
            UpdateExpression: "SET #read = :read",
            ExpressionAttributeNames: {
              "#read": "read",
            },
            ExpressionAttributeValues: {
              ":read": true,
            },
          })
        )
      )
    );
  }
}
