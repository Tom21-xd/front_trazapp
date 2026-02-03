import api from '@/lib/api';
import type { CreateProjectDto, Project, ProjectStats } from '@/types';

export const projectsService = {
  getAll: (includeInactive = false) =>
    api.get<Project[]>('/projects', { includeInactive }),

  getById: (id: string) =>
    api.get<Project>(`/projects/${id}`),

  getStats: (id: string) =>
    api.get<ProjectStats>(`/projects/${id}/stats`),

  create: (data: CreateProjectDto) =>
    api.post<Project>('/projects', data),

  update: (id: string, data: Partial<CreateProjectDto>) =>
    api.patch<Project>(`/projects/${id}`, data),

  delete: (id: string) =>
    api.delete(`/projects/${id}`),
};
