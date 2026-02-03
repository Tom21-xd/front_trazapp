import api from '@/lib/api';
import type { Comment } from '@/types';

export const commentsService = {
  getByActivity: (activityId: string) =>
    api.get<Comment[]>('/comments', { activityId }),

  create: (data: { content: string; activityId: string }) =>
    api.post<Comment>('/comments', data),

  update: (id: string, content: string) =>
    api.patch<Comment>(`/comments/${id}`, { content }),

  delete: (id: string) =>
    api.delete(`/comments/${id}`),
};
