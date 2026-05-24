'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  projectsService,
  activitiesService,
  stageChangesService,
  stagesService,
} from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { Card, CardHeader, CardContent, Badge } from '@/components/ui';
import {
  cn,
  priorityColors,
  statusColors,
  formatDate,
  relativeTime,
} from '@/lib/utils';
import type {
  Project,
  Activity,
  StageChangeRequest,
  Stage,
  Priority,
} from '@/types';

const PRIORITIES: Priority[] = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA'] as Priority[];

// Heurística para "no completado": el orden más alto del catálogo de etapas
// suele ser la etapa final (Completado). Cualquier actividad con currentStageId
// distinto se considera abierta.
function isOpen(activity: Activity, lastStageId: string | null): boolean {
  if (!activity.isActive) return false;
  if (!lastStageId) return true;
  return activity.currentStageId !== lastStageId;
}

function isOverdue(activity: Activity, lastStageId: string | null): boolean {
  if (!activity.dueDate) return false;
  if (!isOpen(activity, lastStageId)) return false;
  return new Date(activity.dueDate).getTime() < Date.now();
}

export default function DashboardPage() {
  const { user, can } = useAuthContext();
  const canReview = can('stagechange:review');
  const canReadAny = can('activity:read:any');
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[] | null>(null);
  const [pendingRequests, setPendingRequests] = useState<StageChangeRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, mineData, stagesData] = await Promise.all([
          projectsService.getAll(),
          activitiesService.getMyActivities(),
          stagesService.getAll(),
        ]);
        setProjects(projectsData);
        setMyActivities(mineData);
        setStages(stagesData);

        if (canReadAny) {
          try {
            const all = await activitiesService.getAll();
            setAllActivities(all);
          } catch {
            setAllActivities([]);
          }
        }

        if (canReview) {
          try {
            const requests = await stageChangesService.getPending();
            setPendingRequests(requests);
          } catch {
            setPendingRequests([]);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [canReview, canReadAny]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Etapa final: la de mayor order
  const orderedStages = [...stages].sort((a, b) => a.order - b.order);
  const lastStage = orderedStages[orderedStages.length - 1] ?? null;
  const lastStageId = lastStage?.id ?? null;

  // Universo sobre el que se calculan los KPIs: si soy admin/supervisor uso
  // el listado global, si soy trabajador uso sólo mis actividades.
  const scope = allActivities ?? myActivities;

  const openActivities = scope.filter((a) => isOpen(a, lastStageId));
  const overdueActivities = scope.filter((a) => isOverdue(a, lastStageId));
  const unassignedActivities = canReadAny
    ? scope.filter((a) => {
        if (!isOpen(a, lastStageId)) return false;
        const assigned =
          (a.assignments?.length ?? 0) > 0 ||
          (a.assignedUsers?.length ?? 0) > 0;
        return !assigned;
      })
    : [];

  // Distribución por etapa (sólo actividades activas)
  const byStage = orderedStages.map((s) => ({
    stage: s,
    count: scope.filter((a) => a.isActive && a.currentStageId === s.id).length,
  }));
  const totalForBar = byStage.reduce((acc, x) => acc + x.count, 0);

  // Distribución por prioridad (sólo abiertas)
  const byPriority = PRIORITIES.map((p) => ({
    priority: p,
    count: openActivities.filter((a) => a.priority === p).length,
  }));

  // Próximas a vencer en los próximos 7 días (abiertas)
  const upcoming = openActivities
    .filter((a) => a.dueDate)
    .filter((a) => {
      const diff = new Date(a.dueDate!).getTime() - Date.now();
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    })
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    )
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div
        data-tour="dashboard-greeting"
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2"
      >
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900">
            Bienvenido{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm lg:text-base text-accent-500">
            {canReadAny
              ? 'Resumen institucional del sistema'
              : 'Tus actividades y pendientes'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/board"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-100 hover:bg-accent-200 text-sm text-accent-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Ir al Tablero
          </Link>
          <Link
            href="/my-tasks"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-sm text-white transition-colors"
          >
            Mis tareas
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div
        data-tour="dashboard-kpis"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      >
        <KpiCard
          label="Mis pendientes"
          value={myActivities.filter((a) => isOpen(a, lastStageId)).length}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          accent="primary"
          href="/my-tasks"
        />
        <KpiCard
          label="Vencidas"
          value={
            (canReadAny
              ? overdueActivities
              : myActivities.filter((a) => isOverdue(a, lastStageId))
            ).length
          }
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          accent="secondary"
        />
        {canReadAny ? (
          <KpiCard
            label="Sin asignar"
            value={unassignedActivities.length}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            accent="orange"
          />
        ) : (
          <KpiCard
            label="Proyectos"
            value={projects.length}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
            accent="blue"
            href="/projects"
          />
        )}
        {canReview ? (
          <KpiCard
            label="Solicitudes por revisar"
            value={pendingRequests.length}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
            accent="yellow"
            href="/stage-changes"
          />
        ) : (
          <KpiCard
            label={canReadAny ? 'Actividades activas' : 'Proyectos'}
            value={canReadAny ? openActivities.length : projects.length}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            accent="blue"
            href={canReadAny ? '/activities' : '/projects'}
          />
        )}
      </div>

      {/* Distribución por etapa */}
      {orderedStages.length > 0 && (
        <Card data-tour="dashboard-stages">
          <CardHeader>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-accent-900">
                  Distribución por etapa
                </h2>
                <p className="text-xs text-accent-500">
                  {totalForBar} actividades activas en {orderedStages.length} etapas
                </p>
              </div>
              <Link
                href="/board"
                className="text-xs font-medium text-primary-700 hover:text-primary-800 shrink-0"
              >
                Abrir tablero →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {totalForBar === 0 ? (
              <p className="text-sm text-accent-500 py-2">
                Sin actividades activas todavía.
              </p>
            ) : (
              <>
                <div className="flex h-3 w-full rounded-full overflow-hidden bg-accent-100">
                  {byStage.map(({ stage, count }) => {
                    const pct = (count / totalForBar) * 100;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={stage.id}
                        title={`${stage.name}: ${count}`}
                        className="h-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: stage.color || '#9CA3AF',
                        }}
                      />
                    );
                  })}
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {byStage.map(({ stage, count }) => (
                    <div
                      key={stage.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: stage.color || '#9CA3AF',
                        }}
                      />
                      <span className="text-accent-700 truncate">
                        {stage.name}
                      </span>
                      <span className="ml-auto text-accent-500 font-medium">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas a vencer */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-accent-900">
              Próximas a vencer
            </h2>
            <p className="text-xs text-accent-500">Próximos 7 días</p>
          </CardHeader>
          <CardContent className="p-0">
            {upcoming.length === 0 ? (
              <p className="p-6 text-center text-sm text-accent-500">
                Sin vencimientos próximos.
              </p>
            ) : (
              <div className="divide-y divide-accent-100">
                {upcoming.map((a) => (
                  <Link
                    key={a.id}
                    href={`/activities/${a.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-accent-50 transition-colors"
                  >
                    <Badge className={priorityColors[a.priority]} size="sm">
                      {a.priority}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-accent-900 truncate">
                        {a.title}
                      </p>
                      <p className="text-xs text-accent-500 truncate">
                        {a.project?.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-accent-700">
                        {formatDate(a.dueDate!)}
                      </p>
                      <p className="text-[11px] text-accent-500">
                        {relativeTime(a.dueDate!)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carga por prioridad */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-accent-900">
              Carga por prioridad
            </h2>
            <p className="text-xs text-accent-500">
              Actividades abiertas en el sistema
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {byPriority.map(({ priority, count }) => {
                const max = Math.max(
                  ...byPriority.map((b) => b.count),
                  1,
                );
                const pct = (count / max) * 100;
                return (
                  <div key={priority} className="flex items-center gap-3">
                    <Badge className={priorityColors[priority]} size="sm">
                      {priority}
                    </Badge>
                    <div className="flex-1 h-2 bg-accent-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          priority === 'URGENTE' && 'bg-red-500',
                          priority === 'ALTA' && 'bg-orange-500',
                          priority === 'MEDIA' && 'bg-yellow-500',
                          priority === 'BAJA' && 'bg-green-500',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-accent-700 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mis actividades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-accent-900">
              Mis actividades
            </h2>
            <Link
              href="/my-tasks"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Ver todas
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {myActivities.length === 0 ? (
            <p className="p-6 text-center text-accent-500">
              No tienes actividades asignadas
            </p>
          ) : (
            <div className="divide-y divide-accent-200">
              {myActivities.slice(0, 5).map((activity) => (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  className="flex items-center justify-between p-4 hover:bg-accent-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-accent-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-accent-500">
                      {activity.project?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {activity.dueDate && (
                      <span className="text-xs text-accent-500 hidden sm:inline">
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

      {/* Proyectos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-accent-900">
              Proyectos recientes
            </h2>
            <Link
              href="/projects"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Ver todos
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <p className="p-6 text-center text-accent-500">No hay proyectos</p>
          ) : (
            <div className="divide-y divide-accent-200">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-4 hover:bg-accent-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-accent-900 truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-accent-500 truncate">
                      {project.description}
                    </p>
                  </div>
                  <Badge
                    className={`${statusColors[project.status]} shrink-0`}
                  >
                    {project.status.replace('_', ' ')}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: 'primary' | 'secondary' | 'blue' | 'yellow' | 'orange';
  href?: string;
}

function KpiCard({ label, value, icon, accent, href }: KpiCardProps) {
  const palette: Record<KpiCardProps['accent'], string> = {
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  const inner = (
    // Móvil: icono arriba + texto debajo (más espacio para el label, sin truncar);
    // sm+ vuelve al layout horizontal compacto.
    <div className="p-3 lg:p-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 lg:gap-4">
      <div
        className={cn(
          'w-9 h-9 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center shrink-0',
          palette[accent],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl lg:text-2xl font-bold text-accent-900 leading-none">
          {value}
        </p>
        <p className="text-xs lg:text-sm text-accent-500 mt-1 leading-tight">
          {label}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block bg-white border border-accent-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="bg-white border border-accent-200 rounded-xl">{inner}</div>
  );
}
