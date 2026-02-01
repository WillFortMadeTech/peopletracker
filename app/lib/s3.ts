import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const isLocal = process.env.AWS_ENDPOINT_URL !== undefined;
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "profile-images";
const AWS_REGION = process.env.AWS_REGION || "eu-west-2";

export const s3Client = new S3Client({
  region: AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
  // Only use explicit credentials for local development (LocalStack)
  ...(isLocal && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
    },
  }),
  forcePathStyle: isLocal,
});

export async function uploadProfileImage(
  userId: string,
  imageBuffer: Buffer,
  contentType: string
): Promise<string> {
  const extension = contentType.split("/")[1] || "jpg";
  const key = `${userId}/profile.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
    })
  );

  // In production, use S3 URL; locally use LocalStack URL
  const imageUrl = isLocal
    ? `${process.env.PUBLIC_S3_URL || "http://localhost:4566"}/${BUCKET_NAME}/${key}`
    : `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  return imageUrl;
}

export async function deleteProfileImage(userId: string): Promise<void> {
  const extensions = ["jpg", "jpeg", "png", "gif", "webp"];

  for (const ext of extensions) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `${userId}/profile.${ext}`,
        })
      );
    } catch {
      // Ignore errors for non-existent files
    }
  }
}
