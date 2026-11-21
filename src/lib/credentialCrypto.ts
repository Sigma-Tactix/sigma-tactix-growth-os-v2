import crypto from "crypto";
import { isPlaceholderSecret } from './secretConfiguration.js';

// Server-only. Encrypts connector credentials (third-party API keys/tokens)
// before they're written to db_store.json, so a leaked or accidentally
// committed store file doesn't hand out live credentials in plaintext.

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const DEV_FALLBACK_KEY = "sigma-tactix-dev-only-insecure-key-do-not-use-in-prod";

function getKey(): Buffer {
  const secret = process.env.CONNECTOR_CREDENTIALS_KEY;
  if ((secret && isPlaceholderSecret(secret)) || (!secret && (process.env.NODE_ENV === 'production' || process.env.VERCEL))) {
    throw new Error('CONNECTOR_CREDENTIALS_KEY must be configured with a real encryption key before storing or reading connector credentials.');
  }
  if (!secret) {
    console.warn(
      "CONNECTOR_CREDENTIALS_KEY is not set — using an insecure dev-only key. " +
      "Set CONNECTOR_CREDENTIALS_KEY before storing real connector credentials."
    );
  }
  return crypto.createHash("sha256").update(secret || DEV_FALLBACK_KEY).digest();
}

export function encryptCredentials(credentials: Record<string, unknown>): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

export function decryptCredentials(blob: string): Record<string, unknown> {
  const raw = Buffer.from(blob, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = raw.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8"));
}
