import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../db/schema.js";
import {
  GoogleAccountConflictError,
  LOGIN_CODE_TTL_MS,
  buildAppRedirect,
  consumeLoginCode,
  createLoginCode,
  isAllowedRedirect,
  signState,
  upgradeGuestWithPassword,
  upsertGoogleUser,
  verifyState,
  type Database,
} from "./google-service.js";

const { users, photos, refreshTokens, oauthLoginCodes } = schema;
const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../db/migrations");
const sqlFiles = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

async function applyMigration(client: PGlite, file: string) {
  const content = readFileSync(path.join(migrationsDir, file), "utf8");
  for (const statement of content.split("--> statement-breakpoint")) {
    if (statement.trim()) await client.exec(statement);
  }
}

let client: PGlite;
let db: Database;

beforeAll(async () => {
  client = new PGlite();
  for (const file of sqlFiles) await applyMigration(client, file);
  db = drizzle(client, { schema }) as unknown as Database;
});

beforeEach(async () => {
  await client.exec("TRUNCATE users CASCADE");
});

async function makeGuest(deviceId = "dev-12345678") {
  const [g] = await db.insert(users).values({ kind: "guest", deviceId, lgpdConsentAt: new Date() }).returning();
  return g!;
}

describe("migration 0007", () => {
  it("applies on top of a database that already has users and keeps them valid", async () => {
    const c = new PGlite();
    const last = sqlFiles[sqlFiles.length - 1]!;
    for (const file of sqlFiles.slice(0, -1)) await applyMigration(c, file);
    await c.exec(
      `INSERT INTO users (kind, email, password_hash) VALUES ('registered', 'old@x.com', 'hash');
       INSERT INTO users (kind, device_id) VALUES ('guest', 'dev-old-12345');`,
    );
    await applyMigration(c, last);
    const rows = await c.query<{ n: number }>("SELECT count(*)::int AS n FROM users");
    expect(rows.rows[0]!.n).toBe(2);
    // new check: registered needs a password OR a google_sub
    await expect(c.exec("INSERT INTO users (kind, email) VALUES ('registered', 'nocred@x.com')")).rejects.toThrow();
    await c.exec("INSERT INTO users (kind, email, google_sub) VALUES ('registered', 'g@x.com', 'sub-1')");
    await c.close();
  });
});

describe("redirect allowlist", () => {
  it("accepts only the app schemes", () => {
    expect(isAllowedRedirect("fio://auth/google")).toBe(true);
    expect(isAllowedRedirect("exp://192.168.0.2:8081/--/auth/google")).toBe(true);
    expect(isAllowedRedirect("exps://x.exp.direct/--/auth/google")).toBe(true);
    expect(isAllowedRedirect("https://evil.com")).toBe(false);
    expect(isAllowedRedirect("javascript:alert(1)")).toBe(false);
    expect(isAllowedRedirect("//evil.com")).toBe(false);
  });

  it("builds the redirect keeping existing query params", () => {
    expect(buildAppRedirect("fio://auth/google", { code: "abc" })).toBe("fio://auth/google?code=abc");
    expect(buildAppRedirect("exp://h/--/a?x=1", { error: "cancelled" })).toBe("exp://h/--/a?x=1&error=cancelled");
  });
});

describe("oauth state", () => {
  const secret = "s".repeat(32);
  it("round-trips", () => {
    const token = signState(secret, { r: "fio://auth/google", g: "guest-id", n: "nonce" });
    expect(verifyState(secret, token)).toMatchObject({ r: "fio://auth/google", g: "guest-id", n: "nonce" });
  });
  it("rejects tampering, wrong secret, expiry and non-allowlisted redirects", () => {
    const token = signState(secret, { r: "fio://auth/google", g: null, n: "n" }, 1_000);
    expect(verifyState(secret, token, 1_000 + 11 * 60 * 1000)).toBeNull();
    expect(verifyState("x".repeat(32), token, 1_000)).toBeNull();
    const [body, mac] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ r: "https://evil.com", g: null, n: "n", e: 9e15 })).toString("base64url");
    expect(verifyState(secret, `${forged}.${mac}`)).toBeNull();
    expect(verifyState(secret, `${body}.bad`)).toBeNull();
    expect(verifyState(secret, "garbage")).toBeNull();
    const evil = signState(secret, { r: "https://evil.com", g: null, n: "n" });
    expect(verifyState(secret, evil)).toBeNull();
  });
});

describe("login code", () => {
  it("is single use", async () => {
    const guest = await makeGuest();
    const code = await createLoginCode(db, guest.id);
    expect(code).toHaveLength(64);
    expect(await consumeLoginCode(db, code)).toBe(guest.id);
    expect(await consumeLoginCode(db, code)).toBeNull();
  });
  it("expires after the TTL", async () => {
    const guest = await makeGuest();
    const now = new Date();
    const code = await createLoginCode(db, guest.id, now);
    expect(await consumeLoginCode(db, code, new Date(now.getTime() + LOGIN_CODE_TTL_MS + 1))).toBeNull();
  });
  it("rejects an unknown code and stores only the hash", async () => {
    const guest = await makeGuest();
    const code = await createLoginCode(db, guest.id);
    expect(await consumeLoginCode(db, "0".repeat(64))).toBeNull();
    const rows = await db.select().from(oauthLoginCodes);
    expect(rows[0]!.codeHash).not.toBe(code);
  });
});

describe("upsertGoogleUser", () => {
  it("(a) returns the user already linked to the sub", async () => {
    const [u] = await db.insert(users).values({ kind: "registered", email: "a@x.com", googleSub: "sub-a" }).returning();
    const got = await upsertGoogleUser(db, { sub: "sub-a", email: "other@x.com", guestId: null });
    expect(got.id).toBe(u!.id);
  });

  it("(b) links google to an existing account with the same e-mail", async () => {
    const [u] = await db
      .insert(users)
      .values({ kind: "registered", email: "b@x.com", passwordHash: "hash" })
      .returning();
    const got = await upsertGoogleUser(db, { sub: "sub-b", email: "B@X.com", guestId: null });
    expect(got.id).toBe(u!.id);
    expect(got.googleSub).toBe("sub-b");
    expect(got.passwordHash).toBe("hash");
  });

  it("(b) refuses to relink an e-mail already tied to another Google account", async () => {
    await db.insert(users).values({ kind: "registered", email: "b@x.com", googleSub: "sub-1" });
    await expect(upsertGoogleUser(db, { sub: "sub-2", email: "b@x.com", guestId: null })).rejects.toBeInstanceOf(
      GoogleAccountConflictError,
    );
  });

  it("(c) converts the calling guest, keeping its data and clearing device_id", async () => {
    const guest = await makeGuest();
    await db.insert(photos).values({
      userId: guest.id,
      kind: "raiz",
      storageKey: "k",
      contentType: "image/jpeg",
      width: 1,
      height: 1,
    });
    await db.insert(refreshTokens).values({ userId: guest.id, tokenHash: "h1", expiresAt: new Date(Date.now() + 1e6) });

    const got = await upsertGoogleUser(db, { sub: "sub-c", email: "c@x.com", guestId: guest.id });
    expect(got.id).toBe(guest.id);
    expect(got).toMatchObject({ kind: "registered", email: "c@x.com", googleSub: "sub-c", deviceId: null });
    expect(await db.select().from(photos).where(eq(photos.userId, guest.id))).toHaveLength(1);
    const [rt] = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, guest.id));
    expect(rt!.revokedAt).not.toBeNull();
  });

  it("(d) creates a new registered user when nothing matches", async () => {
    const got = await upsertGoogleUser(db, { sub: "sub-d", email: "d@x.com", guestId: null });
    expect(got).toMatchObject({ kind: "registered", email: "d@x.com", googleSub: "sub-d", passwordHash: null });
  });

  it("(d) falls back to a new user when the guest id no longer exists", async () => {
    const got = await upsertGoogleUser(db, {
      sub: "sub-d2",
      email: "d2@x.com",
      guestId: "00000000-0000-0000-0000-000000000000",
    });
    expect(got.kind).toBe("registered");
  });

  it("guest + Google account that already exists: signs into the existing one, guest untouched", async () => {
    const guest = await makeGuest();
    const [existing] = await db
      .insert(users)
      .values({ kind: "registered", email: "e@x.com", googleSub: "sub-e" })
      .returning();
    const got = await upsertGoogleUser(db, { sub: "sub-e", email: "e@x.com", guestId: guest.id });
    expect(got.id).toBe(existing!.id);
    const [g] = await db.select().from(users).where(eq(users.id, guest.id));
    expect(g).toMatchObject({ kind: "guest", deviceId: "dev-12345678" });
  });
});

describe("upgradeGuestWithPassword", () => {
  it("happy path: same id, data kept, device_id cleared, old refresh tokens revoked", async () => {
    const guest = await makeGuest();
    await db.insert(refreshTokens).values({ userId: guest.id, tokenHash: "h2", expiresAt: new Date(Date.now() + 1e6) });
    const res = await upgradeGuestWithPassword(db, guest.id, "u@x.com", "hash");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.user).toMatchObject({ id: guest.id, kind: "registered", email: "u@x.com", deviceId: null });
    }
    const [rt] = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, guest.id));
    expect(rt!.revokedAt).not.toBeNull();
  });

  it("rejects an e-mail already in use", async () => {
    await db.insert(users).values({ kind: "registered", email: "taken@x.com", passwordHash: "h" });
    const guest = await makeGuest();
    expect(await upgradeGuestWithPassword(db, guest.id, "taken@x.com", "hash")).toEqual({
      ok: false,
      reason: "email_in_use",
    });
  });

  it("rejects a user that is already registered", async () => {
    const [u] = await db.insert(users).values({ kind: "registered", email: "r@x.com", passwordHash: "h" }).returning();
    expect(await upgradeGuestWithPassword(db, u!.id, "new@x.com", "hash")).toEqual({
      ok: false,
      reason: "not_guest",
    });
  });
});
