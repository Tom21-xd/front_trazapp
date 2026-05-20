'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  activitiesService,
  projectsService,
  stagesService,
  usersService,
} from '@/services';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Select,
  Pagination,
  useToast,
} from '@/components/ui';
import { priorityColors, formatDate } from '@/lib/utils';
import type { Activity, Project, Stage, User, PageMeta } from '@/types';

const FILTERS_KEY = 'trazapp:activities:filters:v1';

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    projectId: '',
    stageId: '',
    priority: '',
    assigneeId: '',
  });
  const [search, setSearch] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const toast = useToast();

  const updateFilter = (patch: Partial<typeof filters>) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  // Carga inicial de catálogos
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
      // El filtro de asignado sólo se ofrece si el usuario puede listar usuarios
      try {
        const usersData = await usersService.getAll();
        setUsers(usersData.filter((u) => u.isActive));
      } catch {
        setUsers([]);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hidratar filtros desde localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(FILTERS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<typeof filters> & {
          search?: string;
        };
        setFilters((f) => ({ ...f, ...saved }));
        if (saved.search) setSearch(saved.search);
      }
    } catch {
      // si el JSON está corrupto, lo ignoramos
    }
    setHydrated(true);
  }, []);

  // Persistir
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({ ...filters, search }),
      );
    } catch {
      // quota / modo privado: silencioso
    }
  }, [hydrated, filters, search]);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.projectId) params.projectId = filters.projectId;
      if (filters.stageId) params.stageId = filters.stageId;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assigneeId) params.assignedUserId = filters.assigneeId;
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

  // Filtro de búsqueda client-side sobre la página actual
  const q = normalize(search.trim());
  const displayedActivities = useMemo(() => {
    if (!q) return activities;
    return activities.filter(
      (a) =>
        normalize(a.title).includes(q) ||
        normalize(a.description ?? '').includes(q),
    );
  }, [activities, q]);

  const activeFilters = [
    filters.projectId,
    filters.stageId,
    filters.priority,
    filters.assigneeId,
    q,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ projectId: '', stageId: '', priority: '', assigneeId: '' });
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Actividades</h1>
        <p className="text-sm lg:text-base text-accent-500">
          Todas las actividades del sistema
        </p>
      </div>

      {/* Filters */}
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
                placeholder="Buscar por título o descripción..."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              id="filterProject"
              placeholder="Todos los proyectos"
              value={filters.projectId}
              onChange={(e) => updateFilter({ projectId: e.target.value })}
              options={[
                { value: '', label: 'Todos los proyectos' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <Select
              id="filterStage"
              placeholder="Todas las etapas"
              value={filters.stageId}
              onChange={(e) => updateFilter({ stageId: e.target.value })}
              options={[
                { value: '', label: 'Todas las etapas' },
                ...stages.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <Select
              id="filterPriority"
              placeholder="Todas las prioridades"
              value={filters.priority}
              onChange={(e) => updateFilter({ priority: e.target.value })}
              options={[
                { value: '', label: 'Todas las prioridades' },
                { value: 'URGENTE', label: 'Urgente' },
                { value: 'ALTA', label: 'Alta' },
                { value: 'MEDIA', label: 'Media' },
                { value: 'BAJA', label: 'Baja' },
              ]}
            />
            {users.length > 0 ? (
              <Select
                id="filterAssignee"
                placeholder="Cualquier asignado"
                value={filters.assigneeId}
                onChange={(e) => updateFilter({ assigneeId: e.target.value })}
                options={[
                  { value: '', label: 'Cualquier asignado' },
                  ...users.map((u) => ({ value: u.id, label: u.name })),
                ]}
              />
            ) : (
              <span />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-accent-900">
            {q
              ? `${displayedActivities.length} de ${activities.length} en esta página`
              : `${meta?.total ?? activities.length} actividades`}
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayedActivities.length === 0 ? (
            <p className="p-6 text-center text-accent-500">
              {q || activeFilters > 0
                ? 'Ninguna actividad coincide con los filtros'
                : 'No hay actividades'}
            </p>
          ) : (
            <div className="divide-y divide-accent-200">
              {displayedActivities.map((activity) => (
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
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    {activity.dueDate && (
                      <span className="text-sm text-accent-500 hidden sm:inline">
                        {formatDate(activity.dueDate)}
                      </span>
                    )}
                    <Badge className={priorityColors[activity.priority]}>
                      {activity.priority}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {meta && !loading && !q && activities.length > 0 && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}
    </div>
  );
}
