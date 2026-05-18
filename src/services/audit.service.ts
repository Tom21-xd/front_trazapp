import api from '@/lib/api';
import { toPage } from '@/lib/pagination';
import type { AuditLog, Paginated } from '@/types';

export const auditService = {
  getPage: async (
    params: {
      page?: number;
      limit?: number;
      entityType?: string;
      action?: string;
    } = {},
  ): Promise<Paginated<AuditLog>> =>
    toPage<AuditLog>(
      await api.get('/audit', {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.entityType ? { entityType: params.entityType } : {}),
        ...(params.action ? { action: params.action } : {}),
      }),
    ),
};
