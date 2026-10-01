import Fastify from "fastify";
import jwt from "@fastify/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({
  NODE_ENV: "test",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "r".repeat(32),
  STORAGE_SIGNING_SECRET: "s".repeat(32),
  GOOGLE_CLIENT_ID: undefined as string | undefined,
  GOOGLE_CLIENT_SECRET: undefined as string | undefined,
  GOOGLE_REDIRECT_URI: undefined as string | undefined,
}));

vi.mock("../config/env.js", () => ({ env: envMock }));
// The routes import the postgres-backed singleton; these tests never reach the DB.
vi.mock("../db/client.js", () => ({ db: {}, queryClient: {} }));
vi.mock("../storage/index.js", () => ({ storage: {}, createSignedAccess: () => ({}) }));

const { authRoutes } = await import("./auth.js");

async function buildApp() {
  const app = Fastify();
  await app.register(jwt, { secret: envMock.JWT_ACCESS_SECRET });
  await app.register(authRoutes);
  return app;
}

const configured = () => {
  envMock.GOOGLE_CLIENT_ID = "client-id";
  envMock.GOOGLE_CLIENT_SECRET = "client-secret";
  envMock.GOOGLE_REDIRECT_URI = "https://api.example.com/api/auth/google/callback";
};

beforeEach(() => {
  envMock.GOOGLE_CLIENT_ID = envMock.GOOGLE_CLIENT_SECRET = envMock.GOOGLE_REDIRECT_URI = undefined;
});
afterEach(() => vi.restoreAllMocks());

describe("POST /api/auth/google/start", () => {
  it("503 sem credenciais do Google", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/google/start",
      payload: { redirectUri: "fio://auth/google", lgpdConsent: true },
    });
    expect(res.statusCode).toBe(503);
    expect(res.json().error).toBe("google_unavailable");
  });

  it("400 com redirect fora da allowlist ou sem LGPD", async () => {
    configured();
    const app = await buildApp();
    for (const payload of [
      { redirectUri: "https://evil.com", lgpdConsent: true },
      { redirectUri: "fio://auth/google", lgpdConsent: false },
      { redirectUri: "fio://auth/google" },
    ]) {
      const res = await app.inject({ method: "POST", url: "/api/auth/google/start", payload });
      expect(res.statusCode).toBe(400);
    }
  });

  it("200 devolve a URL de consentimento do Google com state, nonce e callback", async () => {
    configured();
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/google/start",
      payload: { redirectUri: "exp://192.168.0.2:8081/--/auth/google", lgpdConsent: true },
    });
    expect(res.statusCode).toBe(200);
    const url = new URL(res.json().authUrl);
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://api.example.com/api/auth/google/callback");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("nonce")).toBeTruthy();
  });
});

describe("GET /api/auth/google/callback", () => {
  it("400 HTML quando o state é inválido", async () => {
    configured();
    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/auth/google/callback?code=x&state=nope" });
    expect(res.statusCode).toBe(400);
    expect(res.headers["content-type"]).toContain("text/html");
  });

  it("redireciona ao app com error=cancelled quando o usuário nega", async () => {
    configured();
    const app = await buildApp();
    const start = await app.inject({
      method: "POST",
      url: "/api/auth/google/start",
      payload: { redirectUri: "fio://auth/google", lgpdConsent: true },
    });
    const state = new URL(start.json().authUrl).searchParams.get("state")!;
    const res = await app.inject({
      method: "GET",
      url: `/api/auth/google/callback?error=access_denied&state=${encodeURIComponent(state)}`,
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("fio://auth/google?error=cancelled");
  });
});

describe("POST /api/auth/google/exchange", () => {
  it("400 para code com formato inválido", async () => {
    const app = await buildApp();
    const res = await app.inject({ method: "POST", url: "/api/auth/google/exchange", payload: { code: "curto" } });
    expect(res.statusCode).toBe(400);
  });
});
