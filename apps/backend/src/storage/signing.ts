import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

function sign(key: string, expiresAt: number): string {
  return createHmac("sha256", env.STORAGE_SIGNING_SECRET).update(`${key}:${expiresAt}`).digest("hex");
}

export function createSignedAccess(key: string, ttlSeconds = env.STORAGE_URL_TTL_SECONDS): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  return { token: sign(key, expiresAt), expiresAt };
}

export function verifySignedAccess(key: string, token: string, expiresAt: number): boolean {
  if (Date.now() > expiresAt) return false;

  const expected = sign(key, expiresAt);
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(token, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(expectedBuf, providedBuf);
}
