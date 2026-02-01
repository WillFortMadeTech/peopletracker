import { randomUUID } from "crypto";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamodb";
import { FriendRequest, FriendRequestStatus } from "@/types/friends";

const TABLE_NAME = "FriendRequests";

export async function createFriendRequest(
  senderId: string,
  receiverId: string
): Promise<FriendRequest> {
  const request: FriendRequest = {
    id: randomUUID(),
    senderId,
    receiverId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: request,
    })
  );

  return request;
}

export async function getFriendRequestById(
  id: string
): Promise<FriendRequest | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );

  return (response.Item as FriendRequest) || null;
}

export async function getPendingRequestsForUser(
  receiverId: string
): Promise<FriendRequest[]> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "receiverId-status-index",
      KeyConditionExpression: "receiverId = :receiverId AND #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":receiverId": receiverId,
        ":status": "pending",
      },
    })
  );

  return (response.Items as FriendRequest[]) || [];
}

export async function getSentRequestsByUser(
  senderId: string
): Promise<FriendRequest[]> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "senderId-index",
      KeyConditionExpression: "senderId = :senderId",
      ExpressionAttributeValues: {
        ":senderId": senderId,
      },
    })
  );

  return (response.Items as FriendRequest[]) || [];
}

export async function updateFriendRequestStatus(
  id: string,
  status: FriendRequestStatus
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    })
  );
}

export async function deleteFriendRequest(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
    })
  );
}

export async function getPendingRequestBetweenUsers(
  senderId: string,
  receiverId: string
): Promise<FriendRequest | null> {
  const sentRequests = await getSentRequestsByUser(senderId);
  return (
    sentRequests.find(
      (r) => r.receiverId === receiverId && r.status === "pending"
    ) || null
  );
}
