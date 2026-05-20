'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { auditService } from '@/services';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Pagination,
  useToast,
} from '@/components/ui';
import { cn, formatDateTime, relativeTime } from '@/lib/utils';
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
  STAGE_CHANGE_REQUEST: 'bg-yellow-100 text-yellow-700',
  STAGE_CHANGE_APPROVED: 'bg-green-100 text-green-700',
  STAGE_CHANGE_REJECTED: 'bg-red-100 text-red-700',
};

function PrettyJson({ data }: { data: unknown }) {
  if (data === null || data === undefined) return null;
  let pretty: string;
  try {
    pretty = JSON.stringify(data, null, 2);
  } catch {
    pretty = String(data);
  }
  if (pretty === '{}' || pretty === '[]' || pretty === 'null') return null;
  return (
    <pre className="text-[11px] leading-relaxed text-accent-700 bg-accent-50 border border-accent-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
      {pretty}
    </pre>
  );
}

export default function AuditPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasDetail = (log: AuditLog) => {
    const empty =
      log.newData === undefined ||
      log.newData === null ||
      (typeof log.newData === 'object' &&
        Object.keys(log.newData as object).length === 0);
    return !empty;
  };

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
          Registro inmutable de las acciones del sistema · expande cada fila para ver el detalle
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
                    <th className="w-10">
                      <span className="sr-only">Detalle</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Acción</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Entidad</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Cuándo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-accent-500 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent-200">
                  {logs.map((log) => {
                    const open = expanded.has(log.id);
                    const detail = hasDetail(log);
                    return (
                      <Fragment key={log.id}>
                        <tr className={cn('hover:bg-accent-50', open && 'bg-accent-50/60')}>
                          <td className="px-2 py-3 align-top">
                            {detail ? (
                              <button
                                type="button"
                                onClick={() => toggle(log.id)}
                                aria-label={open ? 'Contraer' : 'Expandir'}
                                className="p-1 rounded hover:bg-accent-200 text-accent-500"
                              >
                                <svg
                                  className={cn(
                                    'w-4 h-4 transition-transform',
                                    open && 'rotate-90',
                                  )}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <Badge
                              className={
                                ACTION_VARIANT[log.action] ||
                                'bg-accent-100 text-accent-700'
                              }
                              size="sm"
                            >
                              {ACTION_LABELS[log.action] || log.action}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-accent-700 align-top whitespace-nowrap">
                            <span className="font-medium">{log.entityType}</span>
                            <span className="text-accent-400 font-mono text-xs">
                              {' · '}
                              {log.entityId.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-accent-600 align-top whitespace-nowrap">
                            {log.user?.name || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-accent-500 align-top whitespace-nowrap">
                            <div>{relativeTime(log.createdAt)}</div>
                            <div className="text-[11px] text-accent-400">
                              {formatDateTime(log.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-accent-400 align-top whitespace-nowrap font-mono">
                            {log.ipAddress || '—'}
                          </td>
                        </tr>
                        {open && detail && (
                          <tr className="bg-accent-50/40">
                            <td />
                            <td colSpan={5} className="px-4 py-3">
                              <p className="text-[11px] font-semibold tracking-wider uppercase text-accent-500 mb-2">
                                Datos enviados
                              </p>
                              <PrettyJson data={log.newData} />
                              {log.userAgent && (
                                <p className="mt-2 text-[11px] text-accent-400 truncate">
                                  UA: {log.userAgent}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
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
