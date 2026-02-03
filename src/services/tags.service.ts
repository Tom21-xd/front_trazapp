import api from '@/lib/api';
import type { CreateTagDto, Tag } from '@/types';

export const tagsService = {
  getAll: () => api.get<Tag[]>('/tags'),

  getById: (id: string) => api.get<Tag>(`/tags/${id}`),

  create: (data: CreateTagDto) => api.post<Tag>('/tags', data),

  update: (id: string, data: Partial<CreateTagDto>) =>
    api.patch<Tag>(`/tags/${id}`, data),

  delete: (id: string) => api.delete(`/tags/${id}`),
};
