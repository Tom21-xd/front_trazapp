import api from '@/lib/api';
import { toArray, toPage } from '@/lib/pagination';
import type { CreateStageDto, Stage, Paginated } from '@/types';

export const stagesService = {
  // Las etapas alimentan el Kanban y los selects → siempre lista completa.
  getAll: async (includeInactive = false): Promise<Stage[]> =>
    toArray<Stage>(
      await api.get('/stages', { includeInactive, all: 'true' }),
    ),

  getPage: async (
    params: { page?: number; limit?: number } = {},
  ): Promise<Paginated<Stage>> =>
    toPage<Stage>(
      await api.get('/stages', {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }),
    ),

  getById: (id: string) => api.get<Stage>(`/stages/${id}`),

  create: (data: CreateStageDto) => api.post<Stage>('/stages', data),

  update: (id: string, data: Partial<CreateStageDto>) =>
    api.patch<Stage>(`/stages/${id}`, data),

  delete: (id: string) => api.delete(`/stages/${id}`),

  reorder: (items: { id: string; order: number }[]) =>
    api.post('/stages/reorder', items),
};
