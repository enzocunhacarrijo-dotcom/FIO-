import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";

export const anthropic = env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 3, timeout: 90_000 })
  : null;

export class AiNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY não está configurada no backend.");
    this.name = "AiNotConfiguredError";
  }
}

export function requireAnthropicClient(): Anthropic {
  if (!anthropic) throw new AiNotConfiguredError();
  return anthropic;
}
