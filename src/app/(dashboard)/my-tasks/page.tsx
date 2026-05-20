'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { activitiesService, stagesService } from '@/services';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Select,
} from '@/components/ui';
import { priorityColors, formatDate, relativeTime, cn } from '@/lib/utils';
import type { Activity, Stage } from '@/types';

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const PRIORITY_ORDER = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA'] as const;

export default function MyTasksPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [hideCompleted, setHideCompleted] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [acts, stagesData] = await Promise.all([
          activitiesService.getMyActivities(),
          stagesService.getAll(),
        ]);
        setActivities(acts);
        setStages(stagesData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const lastStageId = useMemo(() => {
    if (stages.length === 0) return null;
    const ordered = [...stages].sort((a, b) => a.order - b.order);
    return ordered[ordered.length - 1].id;
  }, [stages]);

  const q = normalize(search.trim());
  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (hideCompleted && lastStageId && a.currentStageId === lastStageId) {
        return false;
      }
      if (stageFilter && a.currentStageId !== stageFilter) return false;
      if (priorityFilter && a.priority !== priorityFilter) return false;
      if (
        q &&
        !normalize(a.title).includes(q) &&
        !normalize(a.description ?? '').includes(q) &&
        !normalize(a.project?.name ?? '').includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [activities, hideCompleted, lastStageId, stageFilter, priorityFilter, q]);

  // Próximas a vencer (open con dueDate en orden ascendente)
  const overdue = filtered
    .filter(
      (a) => a.dueDate && new Date(a.dueDate).getTime() < Date.now(),
    )
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    );

  const grouped = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    PRIORITY_ORDER.forEach((p) => (map[p] = []));
    for (const a of filtered) {
      // Las vencidas las mostramos aparte arriba; las excluimos del grouping
      if (a.dueDate && new Date(a.dueDate).getTime() < Date.now()) continue;
      (map[a.priority] ??= []).push(a);
    }
    return map;
  }, [filtered]);

  const activeFilters =
    [stageFilter, priorityFilter, q].filter(Boolean).length +
    (hideCompleted ? 0 : 0);

  const clearFilters = () => {
    setStageFilter('');
    setPriorityFilter('');
    setSearch('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-accent-900">
          Mis tareas
        </h1>
        <p className="text-sm lg:text-base text-accent-500">
          Actividades asignadas a ti — {filtered.length} de {activities.length}
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-60">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en mis tareas..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-accent-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-accent-500 hover:text-accent-700"
              >
                Limpiar ({activeFilters})
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              id="filterStage"
              placeholder="Todas las etapas"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              options={[
                { value: '', label: 'Todas las etapas' },
                ...stages.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <Select
              id="filterPriority"
              placeholder="Todas las prioridades"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: '', label: 'Todas las prioridades' },
                { value: 'URGENTE', label: 'Urgente' },
                { value: 'ALTA', label: 'Alta' },
                { value: 'MEDIA', label: 'Media' },
                { value: 'BAJA', label: 'Baja' },
              ]}
            />
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-accent-200 bg-white text-sm cursor-pointer hover:bg-accent-50 transition-colors">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-accent-700">Ocultar completadas</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 text-accent-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-lg font-medium text-accent-900 mb-1">
              {activities.length === 0 ? 'Sin tareas asignadas' : 'Sin resultados'}
            </h3>
            <p className="text-accent-500">
              {activities.length === 0
                ? 'No tienes actividades asignadas en este momento'
                : 'Prueba con otros filtros'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-100 text-red-700">VENCIDAS</Badge>
                  <span className="text-sm text-accent-500">
                    {overdue.length} {overdue.length === 1 ? 'tarea' : 'tareas'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-accent-200">
                  {overdue.map((activity) => (
                    <Link
                      key={activity.id}
                      href={`/activities/${activity.id}`}
                      className="flex items-center justify-between p-4 hover:bg-accent-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-accent-900 truncate">
                          {activity.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-sm text-accent-500">
                          <span className="truncate max-w-[45vw]">
                            {activity.project?.name}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate max-w-[45vw]">
                            {activity.currentStage?.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {activity.dueDate && (
                          <span className="text-xs text-red-700 font-medium">
                            {relativeTime(activity.dueDate)}
                          </span>
                        )}
                        <Badge
                          className={cn('shrink-0', priorityColors[activity.priority])}
                          size="sm"
                        >
                          {activity.priority}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {PRIORITY_ORDER.map((priority) => {
            const tasks = grouped[priority];
            if (!tasks || tasks.length === 0) return null;
            return (
              <Card key={priority}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge className={priorityColors[priority]}>
                      {priority}
                    </Badge>
                    <span className="text-sm text-accent-500">
                      {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-accent-200">
                    {tasks.map((activity) => (
                      <Link
                        key={activity.id}
                        href={`/activities/${activity.id}`}
                        className="flex items-center justify-between p-4 hover:bg-accent-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-accent-900 truncate">
                            {activity.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-sm text-accent-500">
                            <span className="truncate max-w-[45vw]">
                              {activity.project?.name}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate max-w-[45vw]">
                              {activity.currentStage?.name}
                            </span>
                          </div>
                        </div>
                        {activity.dueDate && (
                          <span className="text-sm text-accent-500 shrink-0 hidden sm:inline">
                            {formatDate(activity.dueDate)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
