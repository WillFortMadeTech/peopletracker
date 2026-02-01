import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const isLocal = process.env.AWS_ENDPOINT_URL !== undefined;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-west-2",
  endpoint: process.env.AWS_ENDPOINT_URL,
  // Only use explicit credentials for local development (LocalStack)
  // In production, the SDK uses the IAM instance role automatically
  ...(isLocal && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
    },
  }),
});

export const docClient = DynamoDBDocumentClient.from(client);

export async function getDocuments() {
  const command = new ScanCommand({
    TableName: process.env.DYNAMODB_TABLE_NAME || "TestTable",
  });

  const response = await docClient.send(command);
  return response.Items || [];
}
