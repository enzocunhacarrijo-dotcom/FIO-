import { z } from "zod";

export const habitSourceSchema = z.enum(["manual", "healthkit", "whoop", "oura", "garmin"]);
export type HabitSource = z.infer<typeof habitSourceSchema>;

export const stressLevelSchema = z.enum(["baixo", "medio", "alto"]);
export type StressLevel = z.infer<typeof stressLevelSchema>;

export const habitEntrySchema = z.object({
  date: z.string(),
  source: habitSourceSchema,
  sleepWell: z.boolean().nullable(),
  stressLevel: stressLevelSchema.nullable(),
});
export type HabitEntry = z.infer<typeof habitEntrySchema>;

export const setHabitEntryRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleepWell: z.boolean().optional(),
  stressLevel: stressLevelSchema.optional(),
});
