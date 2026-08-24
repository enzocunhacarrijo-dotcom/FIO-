import { z } from "zod";

export const healthCheckResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  timestamp: z.string(),
});

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;

export * from "./analysis.js";
export * from "./auth.js";
export * from "./photos.js";
export * from "./questionnaire.js";
export * from "./routine.js";
export * from "./scanner.js";
