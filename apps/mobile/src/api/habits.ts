import { habitEntrySchema, type HabitEntry, type StressLevel } from '@hair-analysis/shared';
import { request } from './client';

export function getHabitEntry(accessToken: string, date: string): Promise<HabitEntry> {
  return request<HabitEntry>(`/api/habits/checkin?date=${date}`, { accessToken }).then((r) => habitEntrySchema.parse(r));
}

export function setHabitEntry(
  accessToken: string,
  date: string,
  entry: { sleepWell?: boolean; stressLevel?: StressLevel },
): Promise<HabitEntry> {
  return request<HabitEntry>('/api/habits/checkin', {
    method: 'POST',
    accessToken,
    body: { date, ...entry },
  }).then((r) => habitEntrySchema.parse(r));
}
