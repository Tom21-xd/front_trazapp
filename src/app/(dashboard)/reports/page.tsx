'use client';

import { useEffect, useState } from 'react';
import { projectsService, reportsService } from '@/services';
import type { StageMetricsReport } from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { Card, CardContent, Select, Button } from '@/components/ui';
import { SkeletonStats } from '@/components/ui';
import { formatDuration } from '@/lib/utils';
import { exportStageMetricsCsv, exportStageMetricsPdf } from '@/lib/stage-report';
import type { Project } from '@/types';

export default function ReportsPage() {
  const { can } = useAuthContext();
  const canReadAny = can('activity:read:any');

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [report, setReport] = useState<StageMetricsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    projectsService
      .getAll()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (!canReadAny) {
      setLoading(false);
      return;
    }
    setLoading(true);
    reportsService
      .stageMetrics(projectId || undefined)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [projectId, canReadAny]);

  if (!canReadAny) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="py-12 text-center text-accent-500">
            No tienes permiso para ver los reportes.
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxAvg = Math.max(1, ...(report?.stages.map((s) => s.avgDurationMs) ?? [1]));

  const handleExport = async (kind: 'pdf' | 'csv') => {
    if (!report) return;
    setExporting(true);
    try {
      if (kind === 'pdf') await exportStageMetricsPdf(report);
      else exportStageMetricsCsv(report);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-accent-900">Reportes</h1>
          <p className="text-accent-500 text-sm mt-1">
            Tiempo que las actividades pasan en cada etapa del flujo.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-64">
            <Select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Todos los proyectos"
              options={[
                { value: '', label: 'Todos los proyectos' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
          <div className="flex gap-2">
            {/* En móvil cada botón ocupa la mitad para llenar el ancho disponible */}
            <Button
              variant="secondary"
              onClick={() => handleExport('csv')}
              disabled={!report || report.stages.length === 0 || exporting}
              className="flex-1 sm:flex-none"
            >
              CSV
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={!report || report.stages.length === 0 || exporting}
              className="flex-1 sm:flex-none"
            >
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonStats />
      ) : !report || report.stages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-accent-500">
            Aún no hay historial de etapas para{' '}
            {report?.projectName ?? 'estos proyectos'}.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-accent-500">Actividades</p>
                <p className="text-2xl font-bold text-accent-900">
                  {report.totalActivities}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-accent-500">Etapas con datos</p>
                <p className="text-2xl font-bold text-accent-900">
                  {report.stages.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-accent-500">En curso ahora</p>
                <p className="text-2xl font-bold text-accent-900">
                  {report.stages.reduce((a, s) => a + s.currentlyInStage, 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-accent-500">Transiciones</p>
                <p className="text-2xl font-bold text-accent-900">
                  {report.stages.reduce((a, s) => a + s.completedSegments, 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tiempo promedio por etapa */}
          <Card>
            <CardContent className="py-5 space-y-5">
              <h2 className="font-semibold text-accent-900">
                Tiempo promedio por etapa
              </h2>
              <div className="space-y-4">
                {report.stages.map((s) => (
                  <div key={s.stageId}>
                    <div className="flex items-center justify-between mb-1.5 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: s.color ?? '#9CA3AF' }}
                        />
                        <span className="text-sm font-medium text-accent-800 truncate">
                          {s.stageName}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-accent-900 shrink-0">
                        {formatDuration(s.avgDurationMs)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-accent-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((s.avgDurationMs / maxAvg) * 100)}%`,
                          backgroundColor: s.color ?? '#9CA3AF',
                          minWidth: s.avgDurationMs > 0 ? '0.5rem' : '0',
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-accent-500">
                      <span>{s.completedSegments} transición(es) completada(s)</span>
                      {s.currentlyInStage > 0 && (
                        <span>
                          {s.currentlyInStage} en esta etapa ahora · antigüedad
                          prom. {formatDuration(s.avgCurrentAgeMs)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
