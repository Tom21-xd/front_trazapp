import { describe, it, expect, beforeEach } from 'vitest';
import { hasSeen, markSeen, resetSeen, tourTitle } from './tours';

describe('hasSeen / markSeen / resetSeen', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('por defecto, ningún tour está visto', () => {
    expect(hasSeen('dashboard')).toBe(false);
    expect(hasSeen('board')).toBe(false);
  });

  it('markSeen persiste y hasSeen lo detecta', () => {
    markSeen('dashboard');
    expect(hasSeen('dashboard')).toBe(true);
    expect(hasSeen('board')).toBe(false);
  });

  it('resetSeen revierte la marca', () => {
    markSeen('board');
    expect(hasSeen('board')).toBe(true);
    resetSeen('board');
    expect(hasSeen('board')).toBe(false);
  });

  it('cada tour es independiente', () => {
    markSeen('dashboard');
    markSeen('notifications');
    expect(hasSeen('dashboard')).toBe(true);
    expect(hasSeen('notifications')).toBe(true);
    expect(hasSeen('board')).toBe(false);
    expect(hasSeen('activityDetail')).toBe(false);
  });
});

describe('tourTitle', () => {
  it('mapea cada nombre de tour a un título legible', () => {
    expect(tourTitle('dashboard')).toBe('Tour del Dashboard');
    expect(tourTitle('board')).toBe('Tour del Tablero Kanban');
    expect(tourTitle('activityDetail')).toBe('Tour del detalle de actividad');
    expect(tourTitle('notifications')).toBe('Tour de notificaciones');
  });
});
