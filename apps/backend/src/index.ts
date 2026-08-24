import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { healthCheckResponseSchema, photoUploadLimits } from "@hair-analysis/shared";
import { env } from "./config/env.js";
import { queryClient } from "./db/client.js";
import { analysisRoutes } from "./routes/analysis.js";
import { authRoutes } from "./routes/auth.js";
import { photosRoutes } from "./routes/photos.js";
import { questionnaireRoutes } from "./routes/questionnaire.js";
import { routineRoutes } from "./routes/routine.js";
import { scannerRoutes } from "./routes/scanner.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(jwt, { secret: env.JWT_ACCESS_SECRET });
await app.register(multipart, {
  attachFieldsToBody: true,
  limits: { fileSize: photoUploadLimits.maxFileSizeBytes },
});
await app.register(authRoutes);
await app.register(questionnaireRoutes);
await app.register(photosRoutes);
await app.register(analysisRoutes);
await app.register(routineRoutes);
await app.register(scannerRoutes);

app.get("/health", async (_request, reply) => {
  try {
    await queryClient`select 1`;
  } catch (error) {
    app.log.error(error, "Database health check failed");
    return reply.status(503).send({
      status: "error",
      service: "backend",
      timestamp: new Date().toISOString(),
      detail: "database unreachable",
    });
  }

  const body = healthCheckResponseSchema.parse({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });

  return reply.status(200).send(body);
});

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
