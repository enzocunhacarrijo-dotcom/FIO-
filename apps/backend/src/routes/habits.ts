import type { FastifyInstance } from "fastify";
import { habitEntrySchema, setHabitEntryRequestSchema, type HabitEntry } from "@hair-analysis/shared";
import { habitData } from "../habits/index.js";
import { requireAuth } from "../middleware/auth.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMPTY_ENTRY = (date: string): HabitEntry => ({ date, source: "manual", sleepWell: null, stressLevel: null });

export async function habitsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/habits/checkin", { preHandler: requireAuth }, async (request, reply) => {
    const { date } = request.query as { date?: string };
    if (!date || !DATE_RE.test(date)) {
      return reply.status(400).send({ error: "invalid_request", message: "Informe a data no formato AAAA-MM-DD." });
    }
    const entry = await habitData.getEntry(request.user.sub, date);
    return reply.send(habitEntrySchema.parse(entry ?? EMPTY_ENTRY(date)));
  });

  app.post("/api/habits/checkin", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = setHabitEntryRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_request", message: "Dados inválidos." });
    }
    const { date, ...rest } = parsed.data;
    const entry = await habitData.setEntry(request.user.sub, date, rest);
    return reply.send(habitEntrySchema.parse(entry));
  });
}
