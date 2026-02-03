import api from '@/lib/api';
import type { CreateStageDto, Stage } from '@/types';

export const stagesService = {
  getAll: (includeInactive = false) =>
    api.get<Stage[]>('/stages', { includeInactive }),

  getById: (id: string) =>
    api.get<Stage>(`/stages/${id}`),

  create: (data: CreateStageDto) =>
    api.post<Stage>('/stages', data),

  update: (id: string, data: Partial<CreateStageDto>) =>
    api.patch<Stage>(`/stages/${id}`, data),

  delete: (id: string) =>
    api.delete(`/stages/${id}`),

  reorder: (items: { id: string; order: number }[]) =>
    api.post('/stages/reorder', items),
};
