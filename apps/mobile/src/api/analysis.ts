import { analysisResultSchema, type AnalysisResult } from '@hair-analysis/shared';
import { ApiError, request } from './client';

export function requestAnalysis(accessToken: string): Promise<AnalysisResult> {
  return request<AnalysisResult>('/api/analysis', { method: 'POST', accessToken }).then((r) =>
    analysisResultSchema.parse(r),
  );
}

export async function getLatestAnalysis(accessToken: string): Promise<AnalysisResult | null> {
  try {
    const r = await request<AnalysisResult>('/api/analysis/latest', { accessToken });
    return analysisResultSchema.parse(r);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
