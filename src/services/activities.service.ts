import api from '@/lib/api';
import { toArray, toPage } from '@/lib/pagination';
import type { Activity, CreateActivityDto, Paginated } from '@/types';

interface Filters {
  [key: string]: string | number | undefined;
  projectId?: string;
  stageId?: string;
  assignedUserId?: string;
  priority?: string;
}

export const activitiesService = {
  // Lista COMPLETA (Kanban / dashboard). El backend pagina; pedimos all=true.
  getAll: async (filters?: Filters): Promise<Activity[]> =>
    toArray<Activity>(
      await api.get('/activities', { ...filters, all: 'true' }),
    ),

  // Lista PAGINADA (vista de actividades con controles de paginación)
  getPage: async (
    filters?: Filters,
    page = 1,
    limit = 20,
  ): Promise<Paginated<Activity>> =>
    toPage<Activity>(
      await api.get('/activities', { ...filters, page, limit }),
    ),

  getMyActivities: async (): Promise<Activity[]> =>
    toArray<Activity>(
      await api.get('/activities/my-activities', { all: 'true' }),
    ),

  getMyActivitiesPage: async (
    page = 1,
    limit = 20,
  ): Promise<Paginated<Activity>> =>
    toPage<Activity>(
      await api.get('/activities/my-activities', { page, limit }),
    ),

  getById: (id: string) => api.get<Activity>(`/activities/${id}`),

  create: (data: CreateActivityDto) =>
    api.post<Activity>('/activities', data),

  update: (id: string, data: Partial<CreateActivityDto>) =>
    api.patch<Activity>(`/activities/${id}`, data),

  delete: (id: string) => api.delete(`/activities/${id}`),

  assign: (id: string, userIds: string[]) =>
    api.post<Activity>(`/activities/${id}/assign`, { userIds }),

  unassign: (activityId: string, userId: string) =>
    api.delete<Activity>(`/activities/${activityId}/unassign/${userId}`),

  changeStage: (id: string, stageId: string) =>
    api.patch<Activity>(`/activities/${id}`, { currentStageId: stageId }),
};
