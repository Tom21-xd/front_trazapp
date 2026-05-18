import api from '@/lib/api';
import { toArray, toPage } from '@/lib/pagination';
import type { CreateUserDto, User, Paginated } from '@/types';

export const usersService = {
  getAll: async (): Promise<User[]> =>
    toArray<User>(await api.get('/users', { all: 'true' })),

  getPage: async (
    params: { page?: number; limit?: number } = {},
  ): Promise<Paginated<User>> =>
    toPage<User>(
      await api.get('/users', {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }),
    ),

  getById: (id: string) => api.get<User>(`/users/${id}`),

  create: (data: CreateUserDto) => api.post<User>('/users', data),

  update: (id: string, data: Partial<CreateUserDto>) =>
    api.patch<User>(`/users/${id}`, data),

  delete: (id: string) => api.delete(`/users/${id}`),

  activate: (id: string) => api.patch<User>(`/users/${id}/activate`),

  deactivate: (id: string) => api.patch<User>(`/users/${id}/deactivate`),
};
