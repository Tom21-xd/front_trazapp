import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cn,
  formatDate,
  formatDateTime,
  getInitials,
  relativeTime,
  priorityColors,
  statusColors,
  stageChangeStatusColors,
} from './utils';

describe('cn (className merger)', () => {
  it('combina clases truthy y elimina duplicados de Tailwind', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
    // tailwind-merge debe quedarse con la última de la misma propiedad
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignora valores falsy', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c');
  });
});

describe('formatDate / formatDateTime', () => {
  it('formatea en es-ES dd/mm/aaaa', () => {
    const d = new Date('2026-05-19T15:30:00Z');
    expect(formatDate(d)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('formatDateTime incluye hora HH:MM', () => {
    const d = new Date('2026-05-19T15:30:00Z');
    expect(formatDateTime(d)).toMatch(/^\d{2}\/\d{2}\/\d{4},?\s+\d{2}:\d{2}$/);
  });

  it('acepta string ISO', () => {
    expect(formatDate('2026-05-19T15:30:00Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe('getInitials', () => {
  it('extrae las primeras letras de cada palabra hasta 2', () => {
    expect(getInitials('Juan Pérez')).toBe('JP');
    expect(getInitials('María Camila García')).toBe('MC');
    expect(getInitials('Sole')).toBe('S');
  });
});

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-20T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve "hace unos segundos" para fechas muy recientes', () => {
    expect(relativeTime(new Date('2026-05-20T11:59:58Z'))).toBe(
      'hace unos segundos',
    );
  });

  it('devuelve minutos cuando aplica', () => {
    expect(relativeTime(new Date('2026-05-20T11:55:00Z'))).toBe('hace 5 min');
  });

  it('devuelve horas cuando aplica', () => {
    expect(relativeTime(new Date('2026-05-20T08:00:00Z'))).toBe('hace 4 h');
  });

  it('devuelve días cuando aplica', () => {
    expect(relativeTime(new Date('2026-05-17T12:00:00Z'))).toBe('hace 3 d');
  });

  it('singular/plural en meses (helper aproxima 30 días/mes)', () => {
    // 36 días → 1 mes
    expect(relativeTime(new Date('2026-04-14T12:00:00Z'))).toBe('hace 1 mes');
    // 91 días → 3 meses
    expect(relativeTime(new Date('2026-02-18T12:00:00Z'))).toBe('hace 3 meses');
  });

  it('singular/plural en años (helper aproxima 360 días/año)', () => {
    // 365 días → ~12 meses → 1 año
    expect(relativeTime(new Date('2025-05-20T12:00:00Z'))).toBe('hace 1 año');
    // 730 días → ~24 meses → 2 años
    expect(relativeTime(new Date('2024-05-21T12:00:00Z'))).toBe('hace 2 años');
  });
});

describe('mapas de colores', () => {
  it('priorityColors tiene las 4 prioridades', () => {
    expect(Object.keys(priorityColors).sort()).toEqual([
      'ALTA',
      'BAJA',
      'MEDIA',
      'URGENTE',
    ]);
  });

  it('statusColors tiene los 4 estados de proyecto', () => {
    expect(Object.keys(statusColors).sort()).toEqual([
      'CANCELADO',
      'COMPLETADO',
      'EN_PROGRESO',
      'PAUSADO',
    ]);
  });

  it('stageChangeStatusColors incluye CANCELADO (estado nuevo)', () => {
    expect(stageChangeStatusColors.CANCELADO).toBeDefined();
    expect(stageChangeStatusColors.PENDIENTE).toBeDefined();
    expect(stageChangeStatusColors.APROBADO).toBeDefined();
    expect(stageChangeStatusColors.RECHAZADO).toBeDefined();
  });
});
