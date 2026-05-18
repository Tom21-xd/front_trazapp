import api from '@/lib/api';
import { toArray, toPage } from '@/lib/pagination';
import type { CreateTagDto, Tag, Paginated } from '@/types';

export const tagsService = {
  // Las etiquetas alimentan selects/filtros → lista completa.
  getAll: async (): Promise<Tag[]> =>
    toArray<Tag>(await api.get('/tags', { all: 'true' })),

  getPage: async (
    params: { page?: number; limit?: number } = {},
  ): Promise<Paginated<Tag>> =>
    toPage<Tag>(
      await api.get('/tags', {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }),
    ),

  getById: (id: string) => api.get<Tag>(`/tags/${id}`),

  create: (data: CreateTagDto) => api.post<Tag>('/tags', data),

  update: (id: string, data: Partial<CreateTagDto>) =>
    api.patch<Tag>(`/tags/${id}`, data),

  delete: (id: string) => api.delete(`/tags/${id}`),
};
