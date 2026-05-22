import api from '@/lib/api';

export interface StageMetric {
  stageId: string;
  stageName: string;
  color: string | null;
  order: number;
  completedSegments: number;
  totalDurationMs: number;
  avgDurationMs: number;
  currentlyInStage: number;
  avgCurrentAgeMs: number;
}

export interface StageMetricsReport {
  generatedAt: string;
  projectId: string | null;
  projectName: string | null;
  totalActivities: number;
  stages: StageMetric[];
}

export const reportsService = {
  stageMetrics: (projectId?: string): Promise<StageMetricsReport> =>
    api.get<StageMetricsReport>(
      '/reports/stage-metrics',
      projectId ? { projectId } : undefined,
    ),
};
