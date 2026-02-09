import { db, queries } from "@ai-digest/db";

const ENV_VAR_MAP = {
  anthropic: "ANTHROPIC_API_KEY",
  elevenlabs: "ELEVENLABS_API_KEY",
} as const;

type ApiKeyProvider = keyof typeof ENV_VAR_MAP;

/**
 * Resolve an API key by checking the database first, then falling back to
 * environment variables. The DB lookup is wrapped in a try/catch so that
 * missing encryption secrets (API_KEY_ENCRYPTION_SECRET) gracefully degrade
 * to the env-var path.
 */
export async function resolveApiKey(provider: ApiKeyProvider): Promise<string> {
  // 1. Try database first
  try {
    const dbKey = await queries.getApiKey(db, provider);
    if (dbKey) return dbKey;
  } catch {
    // DB lookup failed (e.g., no encryption key set) -- fall through to env
  }

  // 2. Fall back to environment variable
  const envVarName = ENV_VAR_MAP[provider];
  const envKey = process.env[envVarName];
  if (envKey) return envKey;

  throw new Error(
    `No API key found for ${provider}. Set it in the admin dashboard or via ${envVarName} env var.`
  );
}
