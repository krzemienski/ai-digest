import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const getR2Client = (): S3Client => {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT ?? "",
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
};

const BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "ai-digest";
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  const publicUrl = `${PUBLIC_URL}/${key}`;
  console.log(`Uploaded to R2: ${key} (${buffer.length} bytes) -> ${publicUrl}`);

  return publicUrl;
}

export function buildEpisodeKey(date: string, format: string = "mp3"): string {
  return `episodes/${date}.${format}`;
}
