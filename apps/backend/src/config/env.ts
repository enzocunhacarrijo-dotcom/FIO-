import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  STORAGE_DIR: z.string().default("./storage"),
  STORAGE_SIGNING_SECRET: z.string().min(16),
  STORAGE_URL_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  AI_MODEL: z.string().default("claude-sonnet-5"),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Google login (optional: without them the /api/auth/google/* routes answer 503).
  // GOOGLE_REDIRECT_URI is the full HTTPS callback registered in the Google console,
  // e.g. https://<host>/api/auth/google/callback.
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  RATE_LIMIT_FREE_ANALYSES_PER_DAY: z.coerce.number().int().positive().default(3),
  RATE_LIMIT_FREE_SCANS_PER_DAY: z.coerce.number().int().positive().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
