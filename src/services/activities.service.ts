import api from '@/lib/api';
import type { Activity, CreateActivityDto } from '@/types';

interface Filters {
  projectId?: string;
  stageId?: string;
  assignedUserId?: string;
  priority?: string;
}

export const activitiesService = {
  getAll: (filters?: Filters) =>
    api.get<Activity[]>('/activities', filters),

  getMyActivities: () =>
    api.get<Activity[]>('/activities/my-activities'),

  getById: (id: string) =>
    api.get<Activity>(`/activities/${id}`),

  create: (data: CreateActivityDto) =>
    api.post<Activity>('/activities', data),

  update: (id: string, data: Partial<CreateActivityDto>) =>
    api.patch<Activity>(`/activities/${id}`, data),

  delete: (id: string) =>
    api.delete(`/activities/${id}`),

  assign: (id: string, userIds: string[]) =>
    api.post<Activity>(`/activities/${id}/assign`, { userIds }),

  unassign: (activityId: string, userId: string) =>
    api.delete<Activity>(`/activities/${activityId}/unassign/${userId}`),
};
