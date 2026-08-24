import type { FastifyInstance, FastifyRequest } from "fastify";
import { desc, eq } from "drizzle-orm";
import { scanResultSchema, type ScanResult } from "@hair-analysis/shared";
import { db } from "../db/client.js";
import { productScans } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { runProductScan, ScanOutputInvalidError, ScanRateLimitExceededError } from "../ai/scan.js";
import { AiNotConfiguredError } from "../ai/client.js";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png"]);

export async function scannerRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/scanner", { preHandler: requireAuth }, async (request: FastifyRequest, reply) => {
    const body = request.body as Record<string, { toBuffer?: () => Promise<Buffer>; mimetype?: string }> | undefined;
    const filePart = body?.file;

    if (!filePart?.toBuffer) {
      return reply.status(400).send({ error: "invalid_request", message: "Envie a foto do rótulo no campo 'file'." });
    }
    const contentType = filePart.mimetype ?? "";
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return reply.status(400).send({ error: "invalid_file_type", message: "Apenas imagens JPEG ou PNG são aceitas." });
    }

    try {
      const buffer = await filePart.toBuffer();
      const result = await runProductScan(request.user.sub, buffer, contentType as "image/jpeg" | "image/png");
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AiNotConfiguredError) {
        return reply.status(503).send({ error: "ai_not_configured", message: "A leitura de produto ainda não está disponível." });
      }
      if (error instanceof ScanRateLimitExceededError) {
        return reply.status(429).send({ error: "rate_limit_exceeded", message: error.message });
      }
      if (error instanceof ScanOutputInvalidError) {
        return reply.status(502).send({ error: "ai_output_invalid", message: error.message });
      }
      app.log.error(error, "Product scan failed");
      return reply.status(500).send({ error: "internal_error", message: "Não foi possível ler este produto agora." });
    }
  });

  app.get("/api/scanner/history", { preHandler: requireAuth }, async (request, reply) => {
    const rows = await db.query.productScans.findMany({
      where: eq(productScans.userId, request.user.sub),
      orderBy: desc(productScans.createdAt),
      limit: 20,
    });
    const results: ScanResult[] = rows.map((row) =>
      scanResultSchema.parse({ ...(row.result as object), id: row.id, createdAt: row.createdAt.toISOString() }),
    );
    return reply.send(results);
  });
}
