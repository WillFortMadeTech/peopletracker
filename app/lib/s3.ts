import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const BUCKET_NAME = "profile-images";
const PUBLIC_S3_URL = process.env.PUBLIC_S3_URL || "http://localhost:4566";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-west-2",
  endpoint: process.env.AWS_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  },
  forcePathStyle: true,
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

  const imageUrl = `${PUBLIC_S3_URL}/${BUCKET_NAME}/${key}`;
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
