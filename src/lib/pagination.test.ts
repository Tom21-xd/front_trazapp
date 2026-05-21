import { describe, it, expect } from 'vitest';
import { toArray, toPage } from './pagination';

describe('toArray', () => {
  it('devuelve el array tal cual si la respuesta ya es un array', () => {
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('extrae .data del envelope paginado', () => {
    expect(toArray({ data: ['a', 'b'], meta: {} })).toEqual(['a', 'b']);
  });

  it('devuelve [] cuando la respuesta no es array ni tiene .data', () => {
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray({})).toEqual([]);
    expect(toArray('string')).toEqual([]);
  });

  it('devuelve [] cuando .data no es array', () => {
    expect(toArray({ data: 'no-array' })).toEqual([]);
  });
});

describe('toPage', () => {
  it('reusa el envelope si trae data + meta', () => {
    const meta = {
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };
    const res = toPage({ data: [1, 2, 3], meta });
    expect(res.data).toEqual([1, 2, 3]);
    expect(res.meta).toBe(meta);
  });

  it('rellena meta cuando sólo viene .data', () => {
    const res = toPage({ data: ['a', 'b'] });
    expect(res.data).toEqual(['a', 'b']);
    expect(res.meta.total).toBe(2);
    expect(res.meta.totalPages).toBe(1);
    expect(res.meta.hasNextPage).toBe(false);
  });

  it('promueve un array crudo a envelope con meta calculada', () => {
    const res = toPage(['x', 'y']);
    expect(res.data).toEqual(['x', 'y']);
    expect(res.meta.total).toBe(2);
  });

  it('devuelve estructura vacía válida para respuestas inválidas', () => {
    const res = toPage(null);
    expect(res.data).toEqual([]);
    expect(res.meta.total).toBe(0);
    expect(res.meta.hasNextPage).toBe(false);
  });
});
