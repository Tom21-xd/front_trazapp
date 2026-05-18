import type { Paginated, PageMeta } from '@/types';

/**
 * Normaliza la respuesta de un listado a array, tolerando ambos formatos:
 * - Envelope paginado `{ data, meta }` (backend actual)
 * - Array crudo `[...]` (compatibilidad / desajustes temporales back-front)
 */
export function toArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (
    res &&
    typeof res === 'object' &&
    Array.isArray((res as { data?: unknown }).data)
  ) {
    return (res as { data: T[] }).data;
  }
  return [];
}

function fallbackMeta(total: number): PageMeta {
  return {
    total,
    page: 1,
    limit: total || 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
}

/** Normaliza a `{ data, meta }`, tolerando que el backend devuelva un array. */
export function toPage<T>(res: unknown): Paginated<T> {
  if (Array.isArray(res)) {
    return { data: res as T[], meta: fallbackMeta(res.length) };
  }
  if (res && typeof res === 'object' && 'data' in res) {
    const r = res as Partial<Paginated<T>>;
    const data = Array.isArray(r.data) ? r.data : [];
    return { data, meta: r.meta ?? fallbackMeta(data.length) };
  }
  return { data: [], meta: fallbackMeta(0) };
}
