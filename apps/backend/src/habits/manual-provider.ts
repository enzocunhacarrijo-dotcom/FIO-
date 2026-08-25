import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { habitCheckins } from "../db/schema.js";
import type { HabitDataProvider, HabitEntry } from "./provider.js";

function toEntry(row: typeof habitCheckins.$inferSelect): HabitEntry {
  return {
    date: row.date,
    source: row.source,
    sleepWell: row.sleepWell,
    stressLevel: row.stressLevel,
  };
}

export class ManualHabitDataProvider implements HabitDataProvider {
  async getEntry(userId: string, date: string): Promise<HabitEntry | null> {
    const row = await db.query.habitCheckins.findFirst({
      where: and(eq(habitCheckins.userId, userId), eq(habitCheckins.date, date), eq(habitCheckins.source, "manual")),
    });
    return row ? toEntry(row) : null;
  }

  async setEntry(
    userId: string,
    date: string,
    entry: Partial<Pick<HabitEntry, "sleepWell" | "stressLevel">>,
  ): Promise<HabitEntry> {
    const existing = await this.getEntry(userId, date);
    const merged = {
      sleepWell: entry.sleepWell !== undefined ? entry.sleepWell : (existing?.sleepWell ?? null),
      stressLevel: entry.stressLevel !== undefined ? entry.stressLevel : (existing?.stressLevel ?? null),
    };

    const [row] = await db
      .insert(habitCheckins)
      .values({ userId, date, source: "manual", ...merged })
      .onConflictDoUpdate({
        target: [habitCheckins.userId, habitCheckins.date, habitCheckins.source],
        set: { ...merged, updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error("Não foi possível salvar o registro de hábito.");
    return toEntry(row);
  }
}
