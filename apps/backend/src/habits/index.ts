import { ManualHabitDataProvider } from "./manual-provider.js";
import type { HabitDataProvider } from "./provider.js";

export const habitData: HabitDataProvider = new ManualHabitDataProvider();

export * from "./provider.js";
