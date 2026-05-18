'use client';

import { useEffect, useState, useCallback } from 'react';
import { auditService } from '@/services';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Pagination,
  useToast,
} from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog, PageMeta } from '@/types';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
  LOGIN: 'Inició sesión',
  LOGOUT: 'Cerró sesión',
  STAGE_CHANGE_REQUEST: 'Solicitó cambio',
  STAGE_CHANGE_APPROVED: 'Aprobó cambio',
  STAGE_CHANGE_REJECTED: 'Rechazó cambio',
  ASSIGNMENT_CREATED: 'Asignó',
  ASSIGNMENT_REMOVED: 'Desasignó',
};

const ACTION_VARIANT: Record<string, string> = {
  CREATE: 'bg-primary-100 text-primary-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-secondary-100 text-secondary-700',
  LOGIN: 'bg-accent-100 text-accent-700',
  LOGOUT: 'bg-accent-100 text-accent-700',
};

export default function AuditPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await auditService.getPage({ page });
      setLogs(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('No se pudo cargar la auditoría');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Auditoría</h1>
        <p className="text-sm lg:text-base text-accent-500">
          Registro de acciones del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-accent-900">
            {meta?.total ?? logs.length} registros
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="p-6 text-center text-accent-500">Sin registros</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190">
                <thead className="bg-accent-50 border-b border-accent-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Acción</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Entidad</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-accent-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={ACTION_VARIANT[log.action] || 'bg-accent-100 text-accent-700'}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-accent-700 whitespace-nowrap">
                        {log.entityType}
                        <span className="text-accent-400"> · {log.entityId.slice(0, 8)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-accent-600 whitespace-nowrap">
                        {log.user?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-accent-500 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-accent-400 whitespace-nowrap">
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {meta && logs.length > 0 && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}
    </div>
  );
}
