import { createHash, randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type AccessTokenPayload = { sub: string; kind: "registered" | "guest" };

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}

export function signAccessToken(app: FastifyInstance, payload: AccessTokenPayload): string {
  return app.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    hash: hashRefreshToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  };
}
