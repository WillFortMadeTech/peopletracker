import { randomUUID } from "crypto";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamodb";

const LOGIN_LOGS_TABLE = "LoginLogs";

export interface LoginLog {
  id: string;
  userId: string;
  email: string;
  timestamp: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
}

export async function logLoginAttempt(
  email: string,
  userId: string | null,
  success: boolean,
  ipAddress: string,
  userAgent: string
): Promise<LoginLog> {
  const log: LoginLog = {
    id: randomUUID(),
    userId: userId || "unknown",
    email: email.toLowerCase(),
    timestamp: new Date().toISOString(),
    success,
    ipAddress,
    userAgent,
  };

  await docClient.send(
    new PutCommand({
      TableName: LOGIN_LOGS_TABLE,
      Item: log,
    })
  );

  return log;
}

export async function getLoginLogsByUser(userId: string): Promise<LoginLog[]> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: LOGIN_LOGS_TABLE,
      IndexName: "userId-timestamp-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // newest first
    })
  );

  return (response.Items || []) as LoginLog[];
}
