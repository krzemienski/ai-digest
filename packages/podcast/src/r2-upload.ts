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

export function buildEpisodeKey(date: string, format: string = "mp3"): string {
  return `episodes/${date}.${format}`;
}
