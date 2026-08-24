import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import { analysisResultSchema, type AnalysisResult } from "@hair-analysis/shared";
import { db } from "../db/client.js";
import { analyses } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import {
  AiOutputInvalidError,
  MissingPhotosError,
  MissingQuestionnaireError,
  RateLimitExceededError,
  runAnalysis,
} from "../ai/analyze.js";
import { AiNotConfiguredError } from "../ai/client.js";

export async function analysisRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/analysis", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const result = await runAnalysis(request.user.sub);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof AiNotConfiguredError) {
        return reply.status(503).send({ error: "ai_not_configured", message: "A análise por IA ainda não está disponível." });
      }
      if (error instanceof MissingPhotosError) {
        return reply.status(400).send({ error: "missing_photos", message: error.message });
      }
      if (error instanceof MissingQuestionnaireError) {
        return reply.status(400).send({ error: "missing_questionnaire", message: error.message });
      }
      if (error instanceof RateLimitExceededError) {
        return reply.status(429).send({ error: "rate_limit_exceeded", message: error.message });
      }
      if (error instanceof AiOutputInvalidError) {
        return reply.status(502).send({ error: "ai_output_invalid", message: error.message });
      }
      app.log.error(error, "Analysis failed");
      return reply.status(500).send({ error: "internal_error", message: "Não foi possível gerar sua análise agora." });
    }
  });

  app.get("/api/analysis/latest", { preHandler: requireAuth }, async (request, reply) => {
    const row = await db.query.analyses.findFirst({
      where: eq(analyses.userId, request.user.sub),
      orderBy: desc(analyses.createdAt),
    });
    if (!row) {
      return reply.status(404).send({ error: "not_found", message: "Nenhuma análise ainda." });
    }
    const result: AnalysisResult = analysisResultSchema.parse({
      ...(row.result as object),
      id: row.id,
      createdAt: row.createdAt.toISOString(),
    });
    return reply.send(result);
  });
}
