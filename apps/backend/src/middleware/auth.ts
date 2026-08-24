import type { FastifyReply, FastifyRequest } from "fastify";

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    await reply.status(401).send({ error: "unauthorized", message: "Token inválido ou ausente." });
  }
}
