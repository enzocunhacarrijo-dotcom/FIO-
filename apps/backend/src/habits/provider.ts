export type HabitSource = "manual" | "healthkit" | "whoop" | "oura" | "garmin";

export type HabitEntry = {
  date: string;
  source: HabitSource;
  sleepWell: boolean | null;
  stressLevel: "baixo" | "medio" | "alto" | null;
};

/** Decoupled on purpose: today only ManualHabitDataProvider exists (2-tap
 * manual entry), but any future wearable integration (HealthKit, Whoop,
 * Oura, Garmin) implements this same interface — callers never change. */
export interface HabitDataProvider {
  getEntry(userId: string, date: string): Promise<HabitEntry | null>;
  setEntry(
    userId: string,
    date: string,
    entry: Partial<Pick<HabitEntry, "sleepWell" | "stressLevel">>,
  ): Promise<HabitEntry>;
}
