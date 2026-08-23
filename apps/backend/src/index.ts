import Fastify from "fastify";
import cors from "@fastify/cors";
import { healthCheckResponseSchema } from "@hair-analysis/shared";
import { env } from "./config/env.js";
import { queryClient } from "./db/client.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

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
