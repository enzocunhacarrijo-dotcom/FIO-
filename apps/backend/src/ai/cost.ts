// Standard published USD-per-million-token rates (not the Sonnet 5 intro
// pricing, which expires 2026-08-31) — see console.anthropic.com/pricing for
// current numbers if this needs updating.
const PRICING_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};
const DEFAULT_PRICING = { input: 3, output: 15 };

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
};

export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const pricing = PRICING_PER_MILLION_TOKENS[model] ?? DEFAULT_PRICING;
  const regularInput = (usage.inputTokens / 1_000_000) * pricing.input;
  const cacheRead = ((usage.cacheReadInputTokens ?? 0) / 1_000_000) * pricing.input * 0.1;
  const cacheWrite = ((usage.cacheCreationInputTokens ?? 0) / 1_000_000) * pricing.input * 1.25;
  const output = (usage.outputTokens / 1_000_000) * pricing.output;
  return regularInput + cacheRead + cacheWrite + output;
}
