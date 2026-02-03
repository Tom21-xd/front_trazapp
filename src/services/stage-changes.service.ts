import api from '@/lib/api';
import type { ReviewStageChangeDto, StageChangeRequest } from '@/types';

export const stageChangesService = {
  getAll: (params?: { activityId?: string; status?: string }) =>
    api.get<StageChangeRequest[]>('/stage-changes', params),

  getPending: () =>
    api.get<StageChangeRequest[]>('/stage-changes/pending'),

  getMyRequests: () =>
    api.get<StageChangeRequest[]>('/stage-changes/my-requests'),

  getById: (id: string) =>
    api.get<StageChangeRequest>(`/stage-changes/${id}`),

  create: (data: { activityId: string; toStageId: string; description: string }) =>
    api.post<StageChangeRequest>('/stage-changes', data),

  review: (id: string, data: ReviewStageChangeDto) =>
    api.patch<StageChangeRequest>(`/stage-changes/${id}/review`, data),

  addComment: (id: string, content: string) =>
    api.post(`/stage-changes/${id}/comments`, { content }),
};
