import api from '@/lib/api';
import { toArray, toPage } from '@/lib/pagination';
import type { AppRole, PermissionGroup, Paginated } from '@/types';

export const rolesService = {
  getAll: async (): Promise<AppRole[]> =>
    toArray<AppRole>(await api.get('/roles', { all: 'true' })),

  getPage: async (
    params: { page?: number; limit?: number } = {},
  ): Promise<Paginated<AppRole>> =>
    toPage<AppRole>(
      await api.get('/roles', {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      }),
    ),

  listPermissions: () =>
    api.get<PermissionGroup[]>('/roles/permissions'),

  create: (data: {
    name: string;
    description?: string;
    permissionKeys: string[];
  }) => api.post<AppRole>('/roles', data),

  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      permissionKeys: string[];
    }>,
  ) => api.patch<AppRole>(`/roles/${id}`, data),

  delete: (id: string) => api.delete(`/roles/${id}`),

  assignToUser: (userId: string, roleId: string | null) =>
    api.patch<{ message: string }>('/roles/assign', { userId, roleId }),
};
