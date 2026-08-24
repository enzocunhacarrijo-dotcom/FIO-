import { questionnaireRecordSchema, type QuestionnaireRecord, type QuestionnaireResponse } from '@hair-analysis/shared';
import { ApiError, request } from './client';

export function submitQuestionnaire(accessToken: string, respostas: QuestionnaireResponse): Promise<QuestionnaireRecord> {
  return request<QuestionnaireRecord>('/api/questionnaire', {
    method: 'POST',
    accessToken,
    body: { respostas },
  }).then((r) => questionnaireRecordSchema.parse(r));
}

export async function hasCompletedQuestionnaire(accessToken: string): Promise<boolean> {
  try {
    await request<QuestionnaireRecord>('/api/questionnaire/latest', { accessToken });
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return false;
    throw err;
  }
}
