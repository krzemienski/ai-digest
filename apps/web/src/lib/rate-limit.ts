import { NextRequest, NextResponse } from "next/server";

const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  store.set(key, { ...entry, count: entry.count + 1 });
  return { success: true, remaining: limit - entry.count - 1, reset: entry.resetAt };
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function applyRateLimit(
  request: NextRequest,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = getClientIp(request);
  const result = rateLimit(ip, limit, windowMs);

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }
  return null;
}
