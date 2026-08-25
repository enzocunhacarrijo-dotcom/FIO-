import { and, desc, eq, gte } from "drizzle-orm";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { scanResultSchema, type QuestionnaireResponse, type ScanResult } from "@hair-analysis/shared";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { analyses, productScans, questionnaireResponses, users } from "../db/schema.js";
import { requireAnthropicClient } from "./client.js";
import { estimateCostUsd } from "./cost.js";
import { SCANNER_PROMPT_VERSION, SCANNER_SYSTEM_PROMPT } from "./prompts/scanner.js";
import { scanAiOutputSchemaV4 } from "./scanner-schema.js";

export class ScanRateLimitExceededError extends Error {
  constructor() {
    super(`Você atingiu o limite de ${env.RATE_LIMIT_FREE_SCANS_PER_DAY} leituras de produto por dia. Tente novamente amanhã.`);
    this.name = "ScanRateLimitExceededError";
  }
}

export class ScanOutputInvalidError extends Error {
  constructor() {
    super("Não foi possível ler este rótulo agora. Tente novamente em alguns instantes.");
    this.name = "ScanOutputInvalidError";
  }
}

export async function runProductScan(userId: string, imageBuffer: Buffer, contentType: "image/jpeg" | "image/png"): Promise<ScanResult> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.isPremium) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await db.query.productScans.findMany({
      where: and(eq(productScans.userId, userId), gte(productScans.createdAt, since)),
    });
    if (recent.length >= env.RATE_LIMIT_FREE_SCANS_PER_DAY) {
      throw new ScanRateLimitExceededError();
    }
  }

  const client = requireAnthropicClient();

  const [latestAnalysis, latestQuestionnaire] = await Promise.all([
    db.query.analyses.findFirst({ where: eq(analyses.userId, userId), orderBy: desc(analyses.createdAt) }),
    db.query.questionnaireResponses.findFirst({
      where: eq(questionnaireResponses.userId, userId),
      orderBy: desc(questionnaireResponses.createdAt),
    }),
  ]);

  const respostas = latestQuestionnaire?.respostas as QuestionnaireResponse | undefined;
  const analysisResult = latestAnalysis?.result as
    | { necessidadesPrioritarias?: string[]; sinaisDeDano?: unknown; porosidadeEstimada?: { valor?: string } }
    | undefined;

  const profileContext = {
    restricoes: respostas?.restricoes ?? [],
    objetivos: respostas?.objetivos ?? [],
    necessidadesPrioritarias: analysisResult?.necessidadesPrioritarias ?? [],
    sinaisDeDano: analysisResult?.sinaisDeDano ?? null,
    porosidadeEstimada: analysisResult?.porosidadeEstimada?.valor ?? null,
  };

  async function callModel() {
    return client.messages.parse({
      model: env.AI_MODEL,
      max_tokens: 8000,
      system: [{ type: "text", text: SCANNER_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: contentType, data: imageBuffer.toString("base64") } },
            { type: "text", text: `Perfil capilar da pessoa (JSON):\n${JSON.stringify(profileContext)}` },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(scanAiOutputSchemaV4) },
    });
  }

  let response = await callModel();
  if (!response.parsed_output) {
    console.warn(`[ai-scan] structured output failed to parse for user=${userId}, retrying once`);
    response = await callModel();
  }
  if (!response.parsed_output) {
    throw new ScanOutputInvalidError();
  }

  const usage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadInputTokens: response.usage.cache_read_input_tokens ?? undefined,
    cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? undefined,
  };
  const costUsd = estimateCostUsd(response.model, usage);
  console.log(
    `[ai-cost-scan] user=${userId} model=${response.model} input=${usage.inputTokens} output=${usage.outputTokens} ` +
      `cacheRead=${usage.cacheReadInputTokens ?? 0} cacheWrite=${usage.cacheCreationInputTokens ?? 0} costUsd=${costUsd.toFixed(4)} promptVersion=${SCANNER_PROMPT_VERSION}`,
  );

  const [row] = await db
    .insert(productScans)
    .values({
      userId,
      result: response.parsed_output,
      model: response.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd,
    })
    .returning();
  if (!row) {
    throw new Error("Não foi possível salvar a leitura do produto.");
  }

  return scanResultSchema.parse({ ...(row.result as object), id: row.id, createdAt: row.createdAt.toISOString() });
}
