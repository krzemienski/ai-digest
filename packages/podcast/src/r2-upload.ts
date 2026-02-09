import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const getS3Client = (): S3Client => {
  return new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
};

const BUCKET_NAME = process.env.S3_BUCKET_NAME ?? "ai-digest-audio";
const PUBLIC_URL =
  process.env.S3_PUBLIC_URL ??
  `https://${BUCKET_NAME}.s3.${process.env.S3_REGION ?? "us-east-1"}.amazonaws.com`;

/**
 * Upload a file buffer to S3/R2 compatible storage.
 *
 * Uses AWS SDK v3 with credentials and bucket configuration from environment variables:
 * - S3_REGION (default: us-east-1)
 * - S3_ACCESS_KEY_ID
 * - S3_SECRET_ACCESS_KEY
 * - S3_BUCKET_NAME (default: ai-digest-audio)
 * - S3_PUBLIC_URL (optional, auto-generated from bucket/region if not set)
 *
 * @param buffer - File data to upload
 * @param key - S3 object key (path within bucket)
 * @param contentType - MIME type (e.g., "audio/mpeg")
 * @returns Public URL of the uploaded file
 * @throws {Error} When upload fails or credentials are invalid
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  const publicUrl = `${PUBLIC_URL}/${key}`;
  return publicUrl;
}

/** @deprecated Use uploadToS3 instead */
export const uploadToR2 = uploadToS3;

/**
 * Build an S3 object key for a podcast episode file.
 *
 * @param date - Episode date in YYYY-MM-DD format
 * @param format - File extension (default: "mp3")
 * @returns S3 key in the format "episodes/{date}.{format}"
 */
export function buildEpisodeKey(date: string, format: string = "mp3"): string {
  return `episodes/${date}.${format}`;
}
