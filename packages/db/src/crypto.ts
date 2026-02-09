import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm" as const;
const IV_BYTES = 16;
const KEY_BYTES = 32;
const KEY_HEX_LENGTH = KEY_BYTES * 2; // 64 hex chars
const KEY_ENV = "API_KEY_ENCRYPTION_SECRET";

function getEncryptionKey(): Buffer {
  const hexKey = process.env[KEY_ENV];

  if (!hexKey) {
    throw new Error(
      `Missing environment variable ${KEY_ENV}. ` +
        `Set it to a 32-byte hex string (${KEY_HEX_LENGTH} hex characters). ` +
        `Generate one with: openssl rand -hex 32`
    );
  }

  if (hexKey.length !== KEY_HEX_LENGTH) {
    throw new Error(
      `${KEY_ENV} must be exactly ${KEY_HEX_LENGTH} hex characters (32 bytes). ` +
        `Got ${hexKey.length} characters. ` +
        `Generate a valid key with: openssl rand -hex 32`
    );
  }

  return Buffer.from(hexKey, "hex");
}

/**
 * Encrypts a plaintext API key using AES-256-GCM.
 *
 * Returns a colon-separated string: `iv:authTag:ciphertext` (all hex-encoded).
 * Each encryption uses a unique random IV, so encrypting the same plaintext
 * twice produces different outputs.
 */
export function encryptApiKey(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted]
    .map((buf) => buf.toString("hex"))
    .join(":");
}

/**
 * Decrypts a token produced by `encryptApiKey`.
 *
 * Expects the format `iv:authTag:ciphertext` (all hex-encoded, colon-separated).
 * Throws if the token is malformed, tampered with, or the encryption key is wrong.
 */
export function decryptApiKey(token: string): string {
  const key = getEncryptionKey();
  const parts = token.split(":");

  if (parts.length !== 3) {
    throw new Error(
      `Invalid encrypted token format. Expected "iv:authTag:ciphertext" (colon-separated hex). ` +
        `Got ${parts.length} parts.`
    );
  }

  const [ivHex, authTagHex, ciphertextHex] = parts as [string, string, string];

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
