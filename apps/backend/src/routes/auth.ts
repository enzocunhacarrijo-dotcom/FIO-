import type { FastifyInstance } from "fastify";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  registerRequestSchema,
  loginRequestSchema,
  guestRequestSchema,
  refreshRequestSchema,
  googleStartRequestSchema,
  googleExchangeRequestSchema,
  upgradeGuestRequestSchema,
  setObjetivoRequestSchema,
  setPremiumRequestSchema,
  analysisResultSchema,
  photoRecordSchema,
  scanResultSchema,
  userDataExportSchema,
  type AuthResponse,
  type CurrentUser,
  type QuestionnaireResponse,
} from "@hair-analysis/shared";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import {
  analyses,
  habitCheckins,
  photos,
  productScans,
  questionnaireResponses,
  refreshTokens,
  users,
} from "../db/schema.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { generateRefreshToken, hashRefreshToken, signAccessToken } from "../auth/tokens.js";
import {
  GoogleAccountConflictError,
  buildAppRedirect,
  consumeLoginCode,
  createLoginCode,
  isAllowedRedirect,
  newNonce,
  signState,
  upgradeGuestWithPassword,
  upsertGoogleUser,
  verifyState,
} from "../auth/google-service.js";
import { requireAuth } from "../middleware/auth.js";
import { createSignedAccess, storage } from "../storage/index.js";

type UserRow = typeof users.$inferSelect;

function toCurrentUser(row: UserRow): CurrentUser {
  return {
    id: row.id,
    kind: row.kind,
    email: row.email,
    objetivoPrincipal: row.objetivoPrincipal,
    isPremium: row.isPremium,
    providers: [...(row.passwordHash ? (["password"] as const) : []), ...(row.googleSub ? (["google"] as const) : [])],
  };
}

async function issueAuthResponse(app: FastifyInstance, user: UserRow): Promise<AuthResponse> {
  const accessToken = signAccessToken(app, { sub: user.id, kind: user.kind });
  const { token: refreshToken, hash, expiresAt } = generateRefreshToken();
  await db.insert(refreshTokens).values({ userId: user.id, tokenHash: hash, expiresAt });
  return { accessToken, refreshToken, user: toCurrentUser(user) };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/auth/register", async (request, reply) => {
    const parsed = registerRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: "invalid_request", message: "E-mail ou senha inválidos. A senha precisa ter ao menos 8 caracteres." });
    }
    const { password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      return reply.status(409).send({ error: "email_in_use", message: "Já existe uma conta com esse e-mail." });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ kind: "registered", email, passwordHash, lgpdConsentAt: new Date() })
      .returning();
    if (!user) {
      return reply.status(500).send({ error: "internal_error", message: "Não foi possível criar a conta. Tente de novo." });
    }

    return reply.status(201).send(await issueAuthResponse(app, user));
  });

  app.post("/api/auth/login", async (request, reply) => {
    const parsed = loginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_request", message: "E-mail ou senha inválidos." });
    }
    const { password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (user && !user.passwordHash && user.googleSub) {
      return reply
        .status(401)
        .send({ error: "use_google", message: "Esta conta usa o Google. Toque em Continuar com Google." });
    }
    if (!user || !user.passwordHash || !(await verifyPassword(user.passwordHash, password))) {
      return reply.status(401).send({ error: "invalid_credentials", message: "E-mail ou senha incorretos." });
    }

    return reply.send(await issueAuthResponse(app, user));
  });

  const googleConfig = () =>
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI
      ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, redirectUri: env.GOOGLE_REDIRECT_URI }
      : null;
  const googleUnavailable = {
    error: "google_unavailable",
    message: "Login com Google indisponível no momento.",
  };

  // Step 1: the app asks for the Google consent URL. The Bearer is optional — when a
  // guest sends it, the resulting Google account is converted from that guest (D3=A).
  app.post("/api/auth/google/start", async (request, reply) => {
    const cfg = googleConfig();
    if (!cfg) return reply.status(503).send(googleUnavailable);

    const parsed = googleStartRequestSchema.safeParse(request.body);
    if (!parsed.success || !isAllowedRedirect(parsed.data.redirectUri)) {
      return reply.status(400).send({
        error: "invalid_request",
        message: "É preciso aceitar a Política de Privacidade para continuar.",
      });
    }

    let guestId: string | null = null;
    try {
      await request.jwtVerify();
      if (request.user.kind === "guest") guestId = request.user.sub;
    } catch {
      // anonymous start is fine
    }

    const nonce = newNonce();
    const state = signState(env.JWT_REFRESH_SECRET, { r: parsed.data.redirectUri, g: guestId, n: nonce });
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      prompt: "select_account",
    });
    return reply.send({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  // Step 2: Google redirects the browser here. We finish the OAuth dance server-side
  // and bounce back to the app with a one-time code (never a JWT in the URL).
  app.get("/api/auth/google/callback", async (request, reply) => {
    const cfg = googleConfig();
    if (!cfg) return reply.status(503).send(googleUnavailable);

    const query = request.query as { code?: string; state?: string; error?: string };
    const state = query.state ? verifyState(env.JWT_REFRESH_SECRET, query.state) : null;
    if (!state) {
      return reply
        .status(400)
        .type("text/html; charset=utf-8")
        .send("<p>Link expirado. Volte ao app e tente de novo.</p>");
    }
    const back = (params: Record<string, string>) => reply.redirect(buildAppRedirect(state.r, params), 302);

    if (query.error || !query.code) return back({ error: "cancelled" });

    try {
      const client = new OAuth2Client(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
      const { tokens } = await client.getToken(query.code);
      if (!tokens.id_token) return back({ error: "google_failed" });
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: cfg.clientId });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || payload.nonce !== state.n) return back({ error: "google_failed" });
      if (payload.email_verified !== true) return back({ error: "email_unverified" });

      const user = await upsertGoogleUser(db, { sub: payload.sub, email: payload.email, guestId: state.g });
      const code = await createLoginCode(db, user.id);
      return back({ code });
    } catch (err) {
      if (!(err instanceof GoogleAccountConflictError)) request.log.error(err, "google callback failed");
      return back({ error: "google_failed" });
    }
  });

  // Step 3: the app trades the one-time code for the usual access/refresh pair.
  app.post("/api/auth/google/exchange", async (request, reply) => {
    const parsed = googleExchangeRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_request", message: "Código inválido." });
    }
    const userId = await consumeLoginCode(db, parsed.data.code);
    const user = userId ? await db.query.users.findFirst({ where: eq(users.id, userId) }) : undefined;
    if (!user) {
      return reply
        .status(401)
        .send({ error: "invalid_code", message: "Não foi possível concluir o login. Tente de novo." });
    }
    return reply.send(await issueAuthResponse(app, user));
  });

  // A guest creating an e-mail/password account keeps their data (D3=A).
  app.post("/api/me/upgrade", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = upgradeGuestRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: "invalid_request", message: "E-mail ou senha inválidos. A senha precisa ter ao menos 8 caracteres." });
    }
    const email = parsed.data.email.toLowerCase();
    const result = await upgradeGuestWithPassword(db, request.user.sub, email, await hashPassword(parsed.data.password));
    if (!result.ok) {
      return result.reason === "not_guest"
        ? reply.status(409).send({ error: "already_registered", message: "Você já tem uma conta." })
        : reply.status(409).send({ error: "email_in_use", message: "Já existe uma conta com esse e-mail." });
    }
    return reply.send(await issueAuthResponse(app, result.user));
  });

  app.post("/api/auth/guest", async (request, reply) => {
    const parsed = guestRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_request", message: "ID de dispositivo inválido." });
    }
    const { deviceId } = parsed.data;

    let user = await db.query.users.findFirst({ where: eq(users.deviceId, deviceId) });
    if (!user) {
      const [created] = await db
        .insert(users)
        .values({ kind: "guest", deviceId, lgpdConsentAt: new Date() })
        .returning();
      if (!created) {
        return reply.status(500).send({ error: "internal_error", message: "Não foi possível criar o acesso convidado." });
      }
      user = created;
    }

    return reply.send(await issueAuthResponse(app, user));
  });

  app.post("/api/auth/refresh", async (request, reply) => {
    const parsed = refreshRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_request", message: "Refresh token inválido." });
    }

    const hash = hashRefreshToken(parsed.data.refreshToken);
    const row = await db.query.refreshTokens.findFirst({
      where: and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, new Date())),
    });
    if (!row) {
      return reply.status(401).send({ error: "invalid_refresh_token", message: "Sessão expirada. Entre novamente." });
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, row.userId) });
    if (!user) {
      return reply.status(401).send({ error: "invalid_refresh_token", message: "Sessão expirada. Entre novamente." });
    }

    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, row.id));

    return reply.send(await issueAuthResponse(app, user));
  });

  app.get("/api/me", { preHandler: requireAuth }, async (request, reply) => {
    const user = await db.query.users.findFirst({ where: eq(users.id, request.user.sub) });
    if (!user) {
      return reply.status(404).send({ error: "not_found", message: "Usuário não encontrado." });
    }
    return reply.send(toCurrentUser(user));
  });

  app.patch("/api/me/objetivo", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = setObjetivoRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_request", message: "Objetivo inválido." });
    }

    const [updated] = await db
      .update(users)
      .set({ objetivoPrincipal: parsed.data.objetivoPrincipal, updatedAt: new Date() })
      .where(eq(users.id, request.user.sub))
      .returning();
    if (!updated) {
      return reply.status(404).send({ error: "not_found", message: "Usuário não encontrado." });
    }
    return reply.send(toCurrentUser(updated));
  });

  // Stub upgrade/downgrade toggle — no real payment provider wired up yet.
  // Flips the flag a checkout would normally set, so the rest of the app
  // (rate limits, paywall gating) can be built and demoed against it now.
  app.patch("/api/me/premium", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = setPremiumRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_request", message: "Valor de premium inválido." });
    }

    const [updated] = await db
      .update(users)
      .set({ isPremium: parsed.data.isPremium, updatedAt: new Date() })
      .where(eq(users.id, request.user.sub))
      .returning();
    if (!updated) {
      return reply.status(404).send({ error: "not_found", message: "Usuário não encontrado." });
    }
    return reply.send(toCurrentUser(updated));
  });

  app.get("/api/me/export", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user.sub;
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      return reply.status(404).send({ error: "not_found", message: "Usuário não encontrado." });
    }

    const [questionnaire, photoRows, analysisRows, scanRows, habitRows] = await Promise.all([
      db.query.questionnaireResponses.findFirst({
        where: eq(questionnaireResponses.userId, userId),
        orderBy: (t, { desc }) => desc(t.createdAt),
      }),
      db.query.photos.findMany({ where: eq(photos.userId, userId) }),
      db.query.analyses.findMany({ where: eq(analyses.userId, userId) }),
      db.query.productScans.findMany({ where: eq(productScans.userId, userId) }),
      db.query.habitCheckins.findMany({ where: eq(habitCheckins.userId, userId) }),
    ]);

    const payload = userDataExportSchema.parse({
      exportadoEm: new Date().toISOString(),
      perfil: toCurrentUser(user),
      questionario: (questionnaire?.respostas as QuestionnaireResponse | undefined) ?? null,
      fotos: photoRows.map((row) => {
        const { token, expiresAt } = createSignedAccess(row.storageKey);
        return photoRecordSchema.parse({
          id: row.id,
          kind: row.kind,
          width: row.width,
          height: row.height,
          createdAt: row.createdAt.toISOString(),
          url: `/api/photos/${row.id}/file?token=${token}&exp=${expiresAt}`,
        });
      }),
      analises: analysisRows.map((row) =>
        analysisResultSchema.parse({ ...(row.result as object), id: row.id, createdAt: row.createdAt.toISOString() }),
      ),
      leiturasDeProduto: scanRows.map((row) =>
        scanResultSchema.parse({ ...(row.result as object), id: row.id, createdAt: row.createdAt.toISOString() }),
      ),
      registrosDeHabito: habitRows.map((row) => ({
        date: row.date,
        source: row.source,
        sleepWell: row.sleepWell,
        stressLevel: row.stressLevel,
      })),
    });

    return reply.send(payload);
  });

  // Account deletion (LGPD "direito de exclusão"). All child tables reference
  // users with onDelete: cascade, so the DB row delete cleans up everything
  // except photo files, which live outside Postgres and are removed first.
  app.delete("/api/me", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user.sub;
    const photoRows = await db.query.photos.findMany({ where: eq(photos.userId, userId) });
    await Promise.all(photoRows.map((row) => storage.delete(row.storageKey)));

    const [deleted] = await db.delete(users).where(eq(users.id, userId)).returning();
    if (!deleted) {
      return reply.status(404).send({ error: "not_found", message: "Usuário não encontrado." });
    }
    return reply.status(204).send();
  });
}
