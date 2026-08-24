import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import { questionnaireSubmitRequestSchema, type QuestionnaireRecord, type QuestionnaireResponse } from "@hair-analysis/shared";
import { db } from "../db/client.js";
import { questionnaireResponses } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export async function questionnaireRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/questionnaire", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = questionnaireSubmitRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_request",
        message: "Algumas respostas do questionário estão incompletas ou inválidas.",
        details: parsed.error.flatten(),
      });
    }

    const [record] = await db
      .insert(questionnaireResponses)
      .values({ userId: request.user.sub, respostas: parsed.data.respostas })
      .returning();
    if (!record) {
      return reply.status(500).send({ error: "internal_error", message: "Não foi possível salvar o questionário." });
    }

    const response: QuestionnaireRecord = {
      id: record.id,
      respostas: record.respostas as QuestionnaireResponse,
      createdAt: record.createdAt.toISOString(),
    };
    return reply.status(201).send(response);
  });

  app.get("/api/questionnaire/latest", { preHandler: requireAuth }, async (request, reply) => {
    const record = await db.query.questionnaireResponses.findFirst({
      where: eq(questionnaireResponses.userId, request.user.sub),
      orderBy: desc(questionnaireResponses.createdAt),
    });
    if (!record) {
      return reply.status(404).send({ error: "not_found", message: "Nenhum questionário respondido ainda." });
    }

    const response: QuestionnaireRecord = {
      id: record.id,
      respostas: record.respostas as QuestionnaireResponse,
      createdAt: record.createdAt.toISOString(),
    };
    return reply.send(response);
  });
}
