'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { activitiesService } from '@/services';
import { Card, CardHeader, CardContent, Badge } from '@/components/ui';
import { priorityColors, formatDate } from '@/lib/utils';
import type { Activity } from '@/types';

export default function MyTasksPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await activitiesService.getMyActivities();
        setActivities(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, []);

  const groupedByPriority = {
    URGENTE: activities.filter((a) => a.priority === 'URGENTE'),
    ALTA: activities.filter((a) => a.priority === 'ALTA'),
    MEDIA: activities.filter((a) => a.priority === 'MEDIA'),
    BAJA: activities.filter((a) => a.priority === 'BAJA'),
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
        <h1 className="text-2xl font-bold text-accent-900">Mis tareas</h1>
        <p className="text-accent-500">Actividades asignadas a ti</p>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 text-accent-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-lg font-medium text-accent-900 mb-1">Sin tareas asignadas</h3>
            <p className="text-accent-500">No tienes actividades asignadas en este momento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByPriority).map(([priority, tasks]) => {
            if (tasks.length === 0) return null;
            return (
              <Card key={priority}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Badge className={priorityColors[priority as keyof typeof priorityColors]}>{priority}</Badge>
                    <span className="text-sm text-accent-500">{tasks.length} tareas</span>
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
                          <p className="font-medium text-accent-900 truncate">{activity.title}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-sm text-accent-500">
                            <span className="truncate max-w-[45vw]">{activity.project?.name}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate max-w-[45vw]">{activity.currentStage?.name}</span>
                          </div>
                        </div>
                        {activity.dueDate && (
                          <span className="text-sm text-accent-500 shrink-0 hidden sm:inline">{formatDate(activity.dueDate)}</span>
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
