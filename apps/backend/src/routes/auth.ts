import type { FastifyInstance } from "fastify";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  registerRequestSchema,
  loginRequestSchema,
  guestRequestSchema,
  refreshRequestSchema,
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
    const { email, password } = parsed.data;

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
    const { email, password } = parsed.data;

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user || !user.passwordHash || !(await verifyPassword(user.passwordHash, password))) {
      return reply.status(401).send({ error: "invalid_credentials", message: "E-mail ou senha incorretos." });
    }

    return reply.send(await issueAuthResponse(app, user));
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
