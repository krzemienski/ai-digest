import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const testBodySchema = z.object({
  provider: z.enum(["anthropic", "elevenlabs"]),
  key: z.string().min(1),
});

async function testAnthropicKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (response.ok) {
      return { valid: true };
    }

    const body = (await response.json()) as { error?: { message?: string } };
    const errorMessage = body.error?.message ?? `HTTP ${String(response.status)}`;

    if (response.status === 401) {
      return { valid: false, error: "Invalid API key" };
    }

    // Other non-auth errors (rate limit, server error) mean the key itself is valid
    if (response.status === 429 || response.status >= 500) {
      return { valid: true };
    }

    return { valid: false, error: errorMessage };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Connection failed: ${message}` };
  }
}

async function testElevenLabsKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        "xi-api-key": key,
      },
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401) {
      return { valid: false, error: "Invalid API key" };
    }

    // Rate limit or server errors mean the key itself is valid
    if (response.status === 429 || response.status >= 500) {
      return { valid: true };
    }

    return { valid: false, error: `HTTP ${String(response.status)}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Connection failed: ${message}` };
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as unknown;
    const parsed = testBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { provider, key } = parsed.data;

    const result =
      provider === "anthropic"
        ? await testAnthropicKey(key)
        : await testElevenLabsKey(key);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { valid: false, error: message },
      { status: 500 }
    );
  }
}
