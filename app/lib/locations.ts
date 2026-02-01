import { randomUUID } from "crypto";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamodb";

const LOCATIONS_TABLE = "Locations";

export interface Location {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  bearing?: number;
  timestamp: string;
  deviceId?: string;
}

export interface CreateLocationInput {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  bearing?: number;
  deviceId?: string;
}

export async function createLocation(
  input: CreateLocationInput
): Promise<Location> {
  const location: Location = {
    id: randomUUID(),
    userId: input.userId,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    altitude: input.altitude,
    speed: input.speed,
    bearing: input.bearing,
    timestamp: new Date().toISOString(),
    deviceId: input.deviceId,
  };

  await docClient.send(
    new PutCommand({
      TableName: LOCATIONS_TABLE,
      Item: location,
    })
  );

  return location;
}

export async function getLocationsByUser(
  userId: string,
  limit: number = 100
): Promise<Location[]> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: LOCATIONS_TABLE,
      IndexName: "userId-timestamp-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // newest first
      Limit: limit,
    })
  );

  return (response.Items || []) as Location[];
}

export async function getLocationsByUserInRange(
  userId: string,
  startTime: string,
  endTime: string
): Promise<Location[]> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: LOCATIONS_TABLE,
      IndexName: "userId-timestamp-index",
      KeyConditionExpression:
        "userId = :userId AND #ts BETWEEN :start AND :end",
      ExpressionAttributeNames: {
        "#ts": "timestamp",
      },
      ExpressionAttributeValues: {
        ":userId": userId,
        ":start": startTime,
        ":end": endTime,
      },
      ScanIndexForward: false,
    })
  );

  return (response.Items || []) as Location[];
}
