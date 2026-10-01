import { createHash } from "node:crypto";
import { and, desc, eq, gte } from "drizzle-orm";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  analysisResultSchema,
  computeQuestionnaireRedFlags,
  type AnalysisResult,
  type QuestionnaireResponse,
} from "@hair-analysis/shared";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { analyses, photos, questionnaireResponses, users } from "../db/schema.js";
import { storage } from "../storage/index.js";
import { requireAnthropicClient } from "./client.js";
import { estimateCostUsd } from "./cost.js";
import { ANALYSIS_PROMPT_VERSION, ANALYSIS_SYSTEM_PROMPT } from "./prompts/analysis.js";
import { analysisAiOutputSchemaV4 } from "./schema.js";

export class MissingPhotosError extends Error {
  constructor() {
    super("As três fotos (comprimento, raiz e pontas) ainda não foram enviadas.");
    this.name = "MissingPhotosError";
  }
}

export class MissingQuestionnaireError extends Error {
  constructor() {
    super("O questionário ainda não foi respondido.");
    this.name = "MissingQuestionnaireError";
  }
}

export class RateLimitExceededError extends Error {
  constructor() {
    super(`Você atingiu o limite de ${env.RATE_LIMIT_FREE_ANALYSES_PER_DAY} análises por dia. Tente novamente amanhã.`);
    this.name = "RateLimitExceededError";
  }
}

export class AiOutputInvalidError extends Error {
  constructor() {
    super("Não foi possível gerar sua análise agora. Tente novamente em alguns instantes.");
    this.name = "AiOutputInvalidError";
  }
}

const PHOTO_LABELS = {
  comprimento: "Imagem 1 — comprimento e textura",
  raiz: "Imagem 2 — raiz e couro cabeludo",
  pontas: "Imagem 3 — pontas do fio",
} as const;
const PHOTO_ORDER = ["comprimento", "raiz", "pontas"] as const;

function toAnalysisResult(row: typeof analyses.$inferSelect): AnalysisResult {
  return analysisResultSchema.parse({
    ...(row.result as object),
    id: row.id,
    createdAt: row.createdAt.toISOString(),
  });
}

export async function runAnalysis(userId: string): Promise<AnalysisResult> {
  const userPhotos = await db.query.photos.findMany({ where: eq(photos.userId, userId) });
  const latestByKind = new Map<string, typeof photos.$inferSelect>();
  for (const photo of userPhotos) {
    const existing = latestByKind.get(photo.kind);
    if (!existing || photo.createdAt > existing.createdAt) latestByKind.set(photo.kind, photo);
  }
  if (!PHOTO_ORDER.every((kind) => latestByKind.has(kind))) {
    throw new MissingPhotosError();
  }

  const questionnaire = await db.query.questionnaireResponses.findFirst({
    where: eq(questionnaireResponses.userId, userId),
    orderBy: desc(questionnaireResponses.createdAt),
  });
  if (!questionnaire) {
    throw new MissingQuestionnaireError();
  }

  const orderedPhotos = PHOTO_ORDER.map((kind) => latestByKind.get(kind)!);
  const photoSetHash = createHash("sha256").update(orderedPhotos.map((p) => p.id).join("|")).digest("hex");

  const cached = await db.query.analyses.findFirst({
    where: and(eq(analyses.userId, userId), eq(analyses.photoSetHash, photoSetHash)),
    orderBy: desc(analyses.createdAt),
  });
  if (cached) {
    console.log(`[ai-cost] cache hit user=${userId} analysisId=${cached.id}`);
    return toAnalysisResult(cached);
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.isPremium) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await db.query.analyses.findMany({
      where: and(eq(analyses.userId, userId), gte(analyses.createdAt, since)),
    });
    if (recentCount.length >= env.RATE_LIMIT_FREE_ANALYSES_PER_DAY) {
      throw new RateLimitExceededError();
    }
  }

  const client = requireAnthropicClient();

  const content: Array<
    { type: "text"; text: string } | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } }
  > = [];
  for (const kind of PHOTO_ORDER) {
    const photo = latestByKind.get(kind)!;
    const bytes = await storage.read(photo.storageKey);
    if (!bytes) throw new Error(`Arquivo da foto ${kind} não encontrado no storage (id=${photo.id}).`);
    content.push({ type: "text", text: PHOTO_LABELS[kind] });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: bytes.toString("base64") } });
  }
  const respostas = questionnaire.respostas as QuestionnaireResponse;
  content.push({
    type: "text",
    text: `Contexto do questionário (JSON):\n${JSON.stringify(respostas)}`,
  });

  const redFlags = computeQuestionnaireRedFlags(respostas);
  const redFlagsText = redFlags.sugereAvaliacaoMedica
    ? `Sinais de alerta identificados no questionário:\n${redFlags.motivos.map((m) => `- ${m}`).join("\n")}`
    : "Sinais de alerta identificados no questionário: nenhum.";
  content.push({
    type: "text",
    text: `${redFlagsText}\nCombinação química de alto risco de quebra relatada (descoloração/luzes/mechas + relaxamento ou progressiva): ${redFlags.combinacaoQuimicaAltoRisco ? "sim" : "não"}.`,
  });

  async function callModel() {
    return client.messages.parse({
      model: env.AI_MODEL,
      max_tokens: 16000,
      system: [{ type: "text", text: ANALYSIS_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
      output_config: { format: zodOutputFormat(analysisAiOutputSchemaV4) },
    });
  }

  let response = await callModel();
  if (!response.parsed_output) {
    console.warn(`[ai-analysis] structured output failed to parse for user=${userId}, retrying once`);
    response = await callModel();
  }
  if (!response.parsed_output) {
    throw new AiOutputInvalidError();
  }

  const parsed = response.parsed_output;
  const { hidratacao, integridade, couro, densidade } = parsed.subScores;
  const total = Math.round((hidratacao + integridade + couro + densidade) / 4);
  const resultToStore = { ...parsed, indiceCapilar: { hidratacao, integridade, couro, densidade, total } };

  const usage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadInputTokens: response.usage.cache_read_input_tokens ?? undefined,
    cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? undefined,
  };
  const costUsd = estimateCostUsd(response.model, usage);
  console.log(
    `[ai-cost] user=${userId} model=${response.model} input=${usage.inputTokens} output=${usage.outputTokens} ` +
      `cacheRead=${usage.cacheReadInputTokens ?? 0} cacheWrite=${usage.cacheCreationInputTokens ?? 0} costUsd=${costUsd.toFixed(4)}`,
  );

  const [row] = await db
    .insert(analyses)
    .values({
      userId,
      photoSetHash,
      promptVersion: ANALYSIS_PROMPT_VERSION,
      model: response.model,
      result: resultToStore,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd,
    })
    .returning();
  if (!row) {
    throw new Error("Não foi possível salvar a análise.");
  }

  return toAnalysisResult(row);
}
