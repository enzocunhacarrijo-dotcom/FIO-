import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { routineStatusSchema, setRoutineStatusRequestSchema, type RoutineStatus } from "@hair-analysis/shared";
import { db } from "../db/client.js";
import { routineCheckins } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function computeStreak(userId: string, todayDate: string): Promise<number> {
  const rows = await db.query.routineCheckins.findMany({ where: eq(routineCheckins.userId, userId) });
  const completedDates = new Set(
    rows.filter((r) => Array.isArray(r.completedActions) && r.completedActions.length > 0).map((r) => r.date),
  );

  let streak = 0;
  const cursor = new Date(`${todayDate}T00:00:00Z`);
  // If today hasn't been checked off yet, count from yesterday backward —
  // not having done today's routine YET shouldn't zero out an earned streak.
  if (!completedDates.has(todayDate)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (!completedDates.has(dateStr)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function routineRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/routine/status", { preHandler: requireAuth }, async (request, reply) => {
    const { date } = request.query as { date?: string };
    if (!date || !DATE_RE.test(date)) {
      return reply.status(400).send({ error: "invalid_request", message: "Informe a data no formato AAAA-MM-DD." });
    }

    const row = await db.query.routineCheckins.findFirst({
      where: and(eq(routineCheckins.userId, request.user.sub), eq(routineCheckins.date, date)),
    });
    const streakDays = await computeStreak(request.user.sub, date);

    const status: RoutineStatus = routineStatusSchema.parse({
      date,
      completedActions: row ? row.completedActions : [],
      streakDays,
    });
    return reply.send(status);
  });

  app.post("/api/routine/status", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = setRoutineStatusRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_request", message: "Dados inválidos." });
    }
    const { date, completedActions } = parsed.data;

    await db
      .insert(routineCheckins)
      .values({ userId: request.user.sub, date, completedActions })
      .onConflictDoUpdate({
        target: [routineCheckins.userId, routineCheckins.date],
        set: { completedActions, updatedAt: new Date() },
      });

    const streakDays = await computeStreak(request.user.sub, date);
    const status: RoutineStatus = routineStatusSchema.parse({ date, completedActions, streakDays });
    return reply.send(status);
  });
}
