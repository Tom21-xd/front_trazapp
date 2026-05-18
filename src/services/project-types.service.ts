import api from '@/lib/api';
import { toArray, toPage } from '@/lib/pagination';
import type { ProjectType, Paginated } from '@/types';

export const projectTypesService = {
  getAll: async (): Promise<ProjectType[]> =>
    toArray<ProjectType>(await api.get('/project-types', { all: 'true' })),

  getPage: async (
    params: { page?: number; limit?: number } = {},
  ): Promise<Paginated<ProjectType>> =>
    toPage<ProjectType>(
      await api.get('/project-types', {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }),
    ),

  create: (data: { name: string; description?: string; color?: string }) =>
    api.post<ProjectType>('/project-types', data),

  update: (
    id: string,
    data: Partial<{ name: string; description: string; color: string }>,
  ) => api.patch<ProjectType>(`/project-types/${id}`, data),

  delete: (id: string) => api.delete(`/project-types/${id}`),
};
