import { z } from "zod";

export const healthCheckResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  timestamp: z.string(),
});

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
