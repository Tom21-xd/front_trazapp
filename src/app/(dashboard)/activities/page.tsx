'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { activitiesService, projectsService, stagesService } from '@/services';
import { Card, CardHeader, CardContent, Badge, Select } from '@/components/ui';
import { priorityColors, formatDate } from '@/lib/utils';
import type { Activity, Project, Stage } from '@/types';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ projectId: '', stageId: '', priority: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, stagesData] = await Promise.all([
          projectsService.getAll(),
          stagesService.getAll(),
        ]);
        setProjects(projectsData);
        setStages(stagesData);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filters.projectId) params.projectId = filters.projectId;
        if (filters.stageId) params.stageId = filters.stageId;
        if (filters.priority) params.priority = filters.priority;
        const data = await activitiesService.getAll(params);
        setActivities(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-accent-900">Actividades</h1>
        <p className="text-accent-500">Todas las actividades del sistema</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              id="filterProject"
              placeholder="Todos los proyectos"
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              options={[{ value: '', label: 'Todos los proyectos' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <Select
              id="filterStage"
              placeholder="Todas las etapas"
              value={filters.stageId}
              onChange={(e) => setFilters({ ...filters, stageId: e.target.value })}
              options={[{ value: '', label: 'Todas las etapas' }, ...stages.map((s) => ({ value: s.id, label: s.name }))]}
            />
            <Select
              id="filterPriority"
              placeholder="Todas las prioridades"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
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
            {activities.length} actividades
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
                    <p className="font-medium text-accent-900">{activity.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-accent-500">
                      <span>{activity.project?.name}</span>
                      <span>•</span>
                      <span>{activity.currentStage?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {activity.dueDate && (
                      <span className="text-sm text-accent-500">{formatDate(activity.dueDate)}</span>
                    )}
                    <Badge className={priorityColors[activity.priority]}>{activity.priority}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
