import api from '@/lib/api';
import { toArray } from '@/lib/pagination';
import type { Comment } from '@/types';

export const commentsService = {
  getByActivity: async (activityId: string): Promise<Comment[]> =>
    toArray<Comment>(
      await api.get('/comments', { activityId, all: 'true' }),
    ),

  create: (data: { content: string; activityId: string }) =>
    api.post<Comment>('/comments', data),

  update: (id: string, content: string) =>
    api.patch<Comment>(`/comments/${id}`, { content }),

  delete: (id: string) =>
    api.delete(`/comments/${id}`),
};
