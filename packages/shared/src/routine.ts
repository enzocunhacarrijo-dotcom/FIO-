import { z } from "zod";

export const routineStatusSchema = z.object({
  date: z.string(),
  completedActions: z.array(z.string()),
  streakDays: z.number().int().min(0),
});
export type RoutineStatus = z.infer<typeof routineStatusSchema>;

// The client sends its own local calendar date (YYYY-MM-DD) — a server-side
// "today" would be wrong near midnight for a Brazil-timezone user hitting a
// server in another timezone.
export const setRoutineStatusRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completedActions: z.array(z.string()),
});
