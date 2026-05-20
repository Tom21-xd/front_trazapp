import api from '@/lib/api';
import { toArray, toPage } from '@/lib/pagination';
import type {
  ReviewStageChangeDto,
  StageChangeRequest,
  Paginated,
} from '@/types';

interface PageParams {
  page?: number;
  limit?: number;
}

export const stageChangesService = {
  getAll: async (params?: {
    activityId?: string;
    status?: string;
  }): Promise<StageChangeRequest[]> =>
    toArray<StageChangeRequest>(
      await api.get('/stage-changes', { ...params, all: 'true' }),
    ),

  getPending: async (): Promise<StageChangeRequest[]> =>
    toArray<StageChangeRequest>(
      await api.get('/stage-changes/pending', { all: 'true' }),
    ),

  getMyRequests: async (): Promise<StageChangeRequest[]> =>
    toArray<StageChangeRequest>(
      await api.get('/stage-changes/my-requests', { all: 'true' }),
    ),

  getPendingPage: async (
    params: PageParams = {},
  ): Promise<Paginated<StageChangeRequest>> =>
    toPage<StageChangeRequest>(
      await api.get('/stage-changes/pending', {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }),
    ),

  getMyRequestsPage: async (
    params: PageParams = {},
  ): Promise<Paginated<StageChangeRequest>> =>
    toPage<StageChangeRequest>(
      await api.get('/stage-changes/my-requests', {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }),
    ),

  getById: (id: string) =>
    api.get<StageChangeRequest>(`/stage-changes/${id}`),

  create: (data: {
    activityId: string;
    toStageId: string;
    description: string;
  }) => api.post<StageChangeRequest>('/stage-changes', data),

  review: (id: string, data: ReviewStageChangeDto) =>
    api.patch<StageChangeRequest>(`/stage-changes/${id}/review`, data),

  cancel: (id: string) =>
    api.patch<StageChangeRequest>(`/stage-changes/${id}/cancel`),

  addComment: (id: string, content: string) =>
    api.post(`/stage-changes/${id}/comments`, { content }),
};
