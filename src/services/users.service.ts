import api from '@/lib/api';
import type { CreateUserDto, User } from '@/types';

export const usersService = {
  getAll: () => api.get<User[]>('/users'),

  getById: (id: string) => api.get<User>(`/users/${id}`),

  create: (data: CreateUserDto) => api.post<User>('/users', data),

  update: (id: string, data: Partial<CreateUserDto>) =>
    api.patch<User>(`/users/${id}`, data),

  delete: (id: string) => api.delete(`/users/${id}`),

  activate: (id: string) => api.patch<User>(`/users/${id}/activate`),

  deactivate: (id: string) => api.patch<User>(`/users/${id}/deactivate`),
};
