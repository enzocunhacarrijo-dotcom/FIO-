import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { photoKindSchema, photoRecordSchema, photoUploadLimits, type PhotoRecord } from "@hair-analysis/shared";
import { db } from "../db/client.js";
import { photos } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { createSignedAccess, storage, verifySignedAccess } from "../storage/index.js";

type PhotoRow = typeof photos.$inferSelect;

function toPhotoRecord(row: PhotoRow): PhotoRecord {
  const { token, expiresAt } = createSignedAccess(row.storageKey);
  return {
    id: row.id,
    kind: row.kind,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt.toISOString(),
    url: `/api/photos/${row.id}/file?token=${token}&exp=${expiresAt}`,
  };
}

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png"]);

export async function photosRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/photos", { preHandler: requireAuth }, async (request: FastifyRequest, reply) => {
    const body = request.body as Record<string, { value?: string; toBuffer?: () => Promise<Buffer>; mimetype?: string }> | undefined;

    const kindField = body?.kind?.value;
    const widthField = body?.width?.value;
    const heightField = body?.height?.value;
    const filePart = body?.file;

    const kindParsed = photoKindSchema.safeParse(kindField);
    const width = Number(widthField);
    const height = Number(heightField);

    if (!kindParsed.success || !Number.isFinite(width) || !Number.isFinite(height) || !filePart?.toBuffer) {
      return reply.status(400).send({
        error: "invalid_request",
        message: "Envie o campo 'kind' (comprimento|raiz|pontas), 'width', 'height' e o arquivo 'file'.",
      });
    }

    const contentType = filePart.mimetype ?? "";
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return reply.status(400).send({ error: "invalid_file_type", message: "Apenas imagens JPEG ou PNG são aceitas." });
    }

    const buffer = await filePart.toBuffer();
    if (buffer.byteLength > photoUploadLimits.maxFileSizeBytes) {
      return reply.status(413).send({ error: "file_too_large", message: "A imagem excede o tamanho máximo permitido." });
    }

    const storageKey = `${randomUUID()}.jpg`;
    await storage.save(storageKey, buffer);

    const [row] = await db
      .insert(photos)
      .values({
        userId: request.user.sub,
        kind: kindParsed.data,
        storageKey,
        contentType,
        width: Math.round(width),
        height: Math.round(height),
      })
      .returning();
    if (!row) {
      return reply.status(500).send({ error: "internal_error", message: "Não foi possível salvar a foto." });
    }

    return reply.status(201).send(photoRecordSchema.parse(toPhotoRecord(row)));
  });

  app.get("/api/photos/latest", { preHandler: requireAuth }, async (request, reply) => {
    const rows = await db.query.photos.findMany({ where: eq(photos.userId, request.user.sub) });

    const latestByKind = new Map<string, PhotoRow>();
    for (const row of rows) {
      const existing = latestByKind.get(row.kind);
      if (!existing || row.createdAt > existing.createdAt) latestByKind.set(row.kind, row);
    }

    return reply.send(Array.from(latestByKind.values()).map((row) => photoRecordSchema.parse(toPhotoRecord(row))));
  });

  app.get("/api/photos/:id/file", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { token, exp } = request.query as { token?: string; exp?: string };

    if (!token || !exp) {
      return reply.status(401).send({ error: "unauthorized", message: "Link de imagem inválido." });
    }

    const row = await db.query.photos.findFirst({ where: eq(photos.id, id) });
    if (!row) {
      return reply.status(404).send({ error: "not_found", message: "Foto não encontrada." });
    }

    const expiresAt = Number(exp);
    if (!Number.isFinite(expiresAt) || !verifySignedAccess(row.storageKey, token, expiresAt)) {
      return reply.status(401).send({ error: "unauthorized", message: "Link de imagem expirado ou inválido." });
    }

    const data = await storage.read(row.storageKey);
    if (!data) {
      return reply.status(404).send({ error: "not_found", message: "Arquivo da foto não encontrado." });
    }

    return reply.header("Content-Type", row.contentType).header("Cache-Control", "private, max-age=60").send(data);
  });
}
