import api from '@/lib/api';
import { toPage } from '@/lib/pagination';
import type { AppNotification, Paginated } from '@/types';

export const notificationsService = {
  getPage: async (
    params: { page?: number; limit?: number; unread?: boolean } = {},
  ): Promise<Paginated<AppNotification>> =>
    toPage<AppNotification>(
      await api.get('/notifications', {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        ...(params.unread ? { unread: 'true' } : {}),
      }),
    ),

  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markRead: (id: string) =>
    api.patch<AppNotification>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<{ message: string }>('/notifications/read-all'),
};
