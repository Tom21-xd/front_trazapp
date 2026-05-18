import api from '@/lib/api';
import { toArray, toPage } from '@/lib/pagination';
import type {
  CreateProjectDto,
  Project,
  ProjectStats,
  Paginated,
} from '@/types';

interface PageParams {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export const projectsService = {
  // Lista COMPLETA (selects, dashboards). El backend pagina; pedimos all=true.
  getAll: async (includeInactive = false): Promise<Project[]> =>
    toArray<Project>(
      await api.get('/projects', { includeInactive, all: 'true' }),
    ),

  // Lista PAGINADA (vista de tabla con controles de paginación)
  getPage: async (params: PageParams = {}): Promise<Paginated<Project>> =>
    toPage<Project>(
      await api.get('/projects', {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        includeInactive: params.includeInactive ?? false,
      }),
    ),

  getById: (id: string) => api.get<Project>(`/projects/${id}`),

  getStats: (id: string) => api.get<ProjectStats>(`/projects/${id}/stats`),

  create: (data: CreateProjectDto) => api.post<Project>('/projects', data),

  update: (id: string, data: Partial<CreateProjectDto>) =>
    api.patch<Project>(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),
};
