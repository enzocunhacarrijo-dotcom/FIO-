import { routineStatusSchema, type RoutineStatus } from '@hair-analysis/shared';
import { request } from './client';

export function getRoutineStatus(accessToken: string, date: string): Promise<RoutineStatus> {
  return request<RoutineStatus>(`/api/routine/status?date=${date}`, { accessToken }).then((r) =>
    routineStatusSchema.parse(r),
  );
}

export function setRoutineStatus(accessToken: string, date: string, completedActions: string[]): Promise<RoutineStatus> {
  return request<RoutineStatus>('/api/routine/status', {
    method: 'POST',
    accessToken,
    body: { date, completedActions },
  }).then((r) => routineStatusSchema.parse(r));
}
