'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectsService, activitiesService, stageChangesService } from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { Card, CardHeader, CardContent, Badge } from '@/components/ui';
import { priorityColors, statusColors, formatDate } from '@/lib/utils';
import type { Project, Activity, StageChangeRequest } from '@/types';

export default function DashboardPage() {
  const { user, isAdmin } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [pendingRequests, setPendingRequests] = useState<StageChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, activitiesData] = await Promise.all([
          projectsService.getAll(),
          activitiesService.getMyActivities(),
        ]);
        setProjects(projectsData);
        setMyActivities(activitiesData);

        if (isAdmin) {
          const requests = await stageChangesService.getPending();
          setPendingRequests(requests);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin]);

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
        <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Dashboard</h1>
        <p className="text-sm lg:text-base text-accent-500">Resumen de tu actividad</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-900">{projects.length}</p>
                <p className="text-sm text-accent-500">Proyectos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-900">{myActivities.length}</p>
                <p className="text-sm text-accent-500">Mis actividades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-900">
                  {myActivities.filter((a) => a.priority === 'URGENTE' || a.priority === 'ALTA').length}
                </p>
                <p className="text-sm text-accent-500">Alta prioridad</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent-900">{pendingRequests.length}</p>
                  <p className="text-sm text-accent-500">Solicitudes pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-accent-900">Mis actividades</h2>
            <Link href="/my-tasks" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todas
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {myActivities.length === 0 ? (
            <p className="p-6 text-center text-accent-500">No tienes actividades asignadas</p>
          ) : (
            <div className="divide-y divide-accent-200">
              {myActivities.slice(0, 5).map((activity) => (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  className="flex items-center justify-between p-4 hover:bg-accent-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-accent-900 truncate">{activity.title}</p>
                    <p className="text-xs text-accent-500">{activity.project?.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {activity.dueDate && (
                      <span className="text-xs text-accent-500">{formatDate(activity.dueDate)}</span>
                    )}
                    <Badge className={priorityColors[activity.priority]}>{activity.priority}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-accent-900">Proyectos recientes</h2>
            <Link href="/projects" className="text-sm text-primary-600 hover:text-primary-700">
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
                    <p className="text-sm font-medium text-accent-900 truncate">{project.name}</p>
                    <p className="text-xs text-accent-500 truncate">{project.description}</p>
                  </div>
                  <Badge className={statusColors[project.status]}>{project.status.replace('_', ' ')}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
