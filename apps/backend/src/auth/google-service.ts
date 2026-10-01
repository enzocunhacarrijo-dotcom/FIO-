import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import * as schema from "../db/schema.js";

const { users, refreshTokens, oauthLoginCodes } = schema;

// Typed against the schema, not a concrete driver, so the same logic runs on
// postgres-js in production and on an in-process Postgres in tests.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = PgDatabase<any, typeof schema>;
export type UserRow = typeof users.$inferSelect;

export const LOGIN_CODE_TTL_MS = 60_000;

// Only the app's own schemes: the backend must never redirect a browser that
// just authenticated with Google to an arbitrary URL carrying a login code.
const REDIRECT_ALLOWLIST = /^(fio|exp|exps):\/\//;

export function isAllowedRedirect(uri: string): boolean {
  return REDIRECT_ALLOWLIST.test(uri);
}

export function hashLoginCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Appends query params to the app deep link, keeping any it already has. */
export function buildAppRedirect(redirectUri: string, params: Record<string, string>): string {
  const sep = redirectUri.includes("?") ? "&" : "?";
  return `${redirectUri}${sep}${new URLSearchParams(params).toString()}`;
}

export async function createLoginCode(database: Database, userId: string, now = new Date()): Promise<string> {
  const code = randomBytes(32).toString("hex");
  await database.insert(oauthLoginCodes).values({
    userId,
    codeHash: hashLoginCode(code),
    expiresAt: new Date(now.getTime() + LOGIN_CODE_TTL_MS),
  });
  return code;
}

/** Atomically burns a code; returns the user id, or null if unknown/used/expired. */
export async function consumeLoginCode(database: Database, code: string, now = new Date()): Promise<string | null> {
  const [row] = await database
    .update(oauthLoginCodes)
    .set({ usedAt: now })
    .where(
      and(
        eq(oauthLoginCodes.codeHash, hashLoginCode(code)),
        isNull(oauthLoginCodes.usedAt),
        gt(oauthLoginCodes.expiresAt, now),
      ),
    )
    .returning({ userId: oauthLoginCodes.userId });
  return row?.userId ?? null;
}

type ConvertFields = { email: string; passwordHash?: string; googleSub?: string };

/**
 * Turns a guest into a registered user in place, so photos/analyses/answers
 * stay on the same user id. device_id is cleared on purpose: otherwise
 * /api/auth/guest on this phone would log into the registered account with no
 * credential. Old refresh tokens are revoked because the JWT `kind` changes.
 */
export async function convertGuest(database: Database, userId: string, fields: ConvertFields): Promise<UserRow | null> {
  return database.transaction(async (tx) => {
    const [user] = await tx
      .update(users)
      .set({
        kind: "registered",
        email: fields.email,
        passwordHash: fields.passwordHash ?? null,
        googleSub: fields.googleSub ?? null,
        deviceId: null,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), eq(users.kind, "guest")))
      .returning();
    if (!user) return null;
    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
    return user;
  });
}

export type UpgradeResult =
  | { ok: true; user: UserRow }
  | { ok: false; reason: "not_guest" | "email_in_use" };

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function upgradeGuestWithPassword(
  database: Database,
  userId: string,
  email: string,
  passwordHash: string,
): Promise<UpgradeResult> {
  const current = await database.query.users.findFirst({ where: eq(users.id, userId) });
  if (!current || current.kind !== "guest") return { ok: false, reason: "not_guest" };

  const taken = await database.query.users.findFirst({ where: eq(users.email, email) });
  if (taken) return { ok: false, reason: "email_in_use" };

  try {
    const user = await convertGuest(database, userId, { email, passwordHash });
    return user ? { ok: true, user } : { ok: false, reason: "not_guest" };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: "email_in_use" };
    throw err;
  }
}

export class GoogleAccountConflictError extends Error {}

/**
 * Resolves the local user for a verified Google identity (email_verified must
 * already have been checked by the caller):
 *  a) known google_sub            -> that user
 *  b) same e-mail                 -> link google_sub to it (safe: verified e-mail)
 *  c) caller is a guest           -> convert the guest, keeping its data
 *  d) otherwise                   -> brand new registered user
 * In a/b a guest in `guestId` is left untouched (no merge).
 */
export async function upsertGoogleUser(
  database: Database,
  input: { sub: string; email: string; guestId: string | null },
): Promise<UserRow> {
  const email = input.email.toLowerCase();

  const bySub = await database.query.users.findFirst({ where: eq(users.googleSub, input.sub) });
  if (bySub) return bySub;

  const byEmail = await database.query.users.findFirst({ where: eq(users.email, email) });
  if (byEmail) {
    if (byEmail.googleSub && byEmail.googleSub !== input.sub) throw new GoogleAccountConflictError();
    const [linked] = await database
      .update(users)
      .set({ googleSub: input.sub, updatedAt: new Date() })
      .where(eq(users.id, byEmail.id))
      .returning();
    return linked ?? byEmail;
  }

  if (input.guestId) {
    const converted = await convertGuest(database, input.guestId, { email, googleSub: input.sub });
    if (converted) return converted;
  }

  const [created] = await database
    .insert(users)
    .values({ kind: "registered", email, googleSub: input.sub, lgpdConsentAt: new Date() })
    .returning();
  if (!created) throw new Error("failed to create google user");
  return created;
}

// Re-exported so routes can build the id-token nonce without importing crypto.
export function newNonce(): string {
  return randomBytes(16).toString("hex");
}


export type OAuthState = {
  /** App deep link to return to. */
  r: string;
  /** Guest user id that started the flow, if any. */
  g: string | null;
  /** Nonce also sent to Google and checked against the id token. */
  n: string;
  /** Expiry, ms since epoch. */
  e: number;
};

const STATE_TTL_MS = 10 * 60 * 1000;

// Not a JWT on purpose: access tokens share a signing key with @fastify/jwt, and a
// state token must never be accepted as a session. HMAC with a separate secret.
export function signState(secret: string, data: Omit<OAuthState, "e">, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ ...data, e: now + STATE_TTL_MS })).toString("base64url");
  const mac = createHmac("sha256", secret).update(`oauth-state.${body}`).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyState(secret: string, token: string, now = Date.now()): OAuthState | null {
  const [body, mac, extra] = token.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const expected = createHmac("sha256", secret).update(`oauth-state.${body}`).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthState;
    if (typeof parsed.r !== "string" || typeof parsed.n !== "string" || typeof parsed.e !== "number") return null;
    if (parsed.e < now || !isAllowedRedirect(parsed.r)) return null;
    return { r: parsed.r, g: typeof parsed.g === "string" ? parsed.g : null, n: parsed.n, e: parsed.e };
  } catch {
    return null;
  }
}
