'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { activitiesService, projectsService, stagesService } from '@/services';
import { Card, CardHeader, CardContent, Badge, Select, Pagination, useToast } from '@/components/ui';
import { priorityColors, formatDate } from '@/lib/utils';
import type { Activity, Project, Stage, PageMeta } from '@/types';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ projectId: '', stageId: '', priority: '' });
  const toast = useToast();

  const updateFilter = (patch: Partial<typeof filters>) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, stagesData] = await Promise.all([
          projectsService.getAll(),
          stagesService.getAll(),
        ]);
        setProjects(projectsData);
        setStages(stagesData);
      } catch {
        toast.error('No se pudieron cargar los filtros');
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.projectId) params.projectId = filters.projectId;
      if (filters.stageId) params.stageId = filters.stageId;
      if (filters.priority) params.priority = filters.priority;
      const res = await activitiesService.getPage(params, page);
      setActivities(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('No se pudieron cargar las actividades');
    } finally {
      setLoading(false);
    }
  }, [filters, page, toast]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Actividades</h1>
        <p className="text-sm lg:text-base text-accent-500">Todas las actividades del sistema</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              id="filterProject"
              placeholder="Todos los proyectos"
              value={filters.projectId}
              onChange={(e) => updateFilter({ projectId: e.target.value })}
              options={[{ value: '', label: 'Todos los proyectos' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <Select
              id="filterStage"
              placeholder="Todas las etapas"
              value={filters.stageId}
              onChange={(e) => updateFilter({ stageId: e.target.value })}
              options={[{ value: '', label: 'Todas las etapas' }, ...stages.map((s) => ({ value: s.id, label: s.name }))]}
            />
            <Select
              id="filterPriority"
              placeholder="Todas las prioridades"
              value={filters.priority}
              onChange={(e) => updateFilter({ priority: e.target.value })}
              options={[
                { value: '', label: 'Todas las prioridades' },
                { value: 'BAJA', label: 'Baja' },
                { value: 'MEDIA', label: 'Media' },
                { value: 'ALTA', label: 'Alta' },
                { value: 'URGENTE', label: 'Urgente' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-accent-900">
            {meta?.total ?? activities.length} actividades
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <p className="p-6 text-center text-accent-500">No hay actividades</p>
          ) : (
            <div className="divide-y divide-accent-200">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  className="flex items-center justify-between p-4 hover:bg-accent-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-accent-900 truncate">{activity.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-sm text-accent-500">
                      <span className="truncate max-w-[45vw]">{activity.project?.name}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate max-w-[45vw]">{activity.currentStage?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    {activity.dueDate && (
                      <span className="text-sm text-accent-500 hidden sm:inline">{formatDate(activity.dueDate)}</span>
                    )}
                    <Badge className={priorityColors[activity.priority]}>{activity.priority}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {meta && !loading && activities.length > 0 && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}
    </div>
  );
}
