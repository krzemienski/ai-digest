import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, sql } from "@ai-digest/db";

interface ServiceHealth {
  service: string;
  status: "healthy" | "degraded" | "down" | "unconfigured";
  message: string;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  const services: ServiceHealth[] = [];

  // PostgreSQL
  try {
    await db.execute(sql`SELECT 1`);
    services.push({
      service: "postgresql",
      status: "healthy",
      message: "Connected",
    });
  } catch {
    services.push({
      service: "postgresql",
      status: "down",
      message: "Connection failed",
    });
  }

  // Redis
  try {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const url = new URL(redisUrl);
    const { Queue } = await import("bullmq");
    const testQueue = new Queue("health-check", {
      connection: {
        host: url.hostname,
        port: Number(url.port) || 6379,
        password: url.password || undefined,
      },
    });
    const client = await testQueue.client;
    await (client as { ping: () => Promise<string> }).ping();
    await testQueue.close();
    services.push({ service: "redis", status: "healthy", message: "Connected" });
  } catch {
    services.push({
      service: "redis",
      status: "down",
      message: "Connection failed",
    });
  }

  // Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    services.push({
      service: "anthropic",
      status: "healthy",
      message: "API key configured",
    });
  } else {
    services.push({
      service: "anthropic",
      status: "unconfigured",
      message: "ANTHROPIC_API_KEY not set",
    });
  }

  // ElevenLabs
  if (process.env.ELEVENLABS_API_KEY) {
    services.push({
      service: "elevenlabs",
      status: "healthy",
      message: "API key configured",
    });
  } else {
    services.push({
      service: "elevenlabs",
      status: "unconfigured",
      message: "ELEVENLABS_API_KEY not set",
    });
  }

  // S3
  if (process.env.S3_ACCESS_KEY_ID) {
    services.push({
      service: "s3",
      status: "healthy",
      message: "Credentials configured",
    });
  } else {
    services.push({
      service: "s3",
      status: "unconfigured",
      message: "S3_ACCESS_KEY_ID not set",
    });
  }

  // Resend
  if (process.env.RESEND_API_KEY) {
    services.push({
      service: "resend",
      status: "healthy",
      message: "API key configured",
    });
  } else {
    services.push({
      service: "resend",
      status: "unconfigured",
      message: "RESEND_API_KEY not set",
    });
  }

  return NextResponse.json({ success: true, data: services });
}
