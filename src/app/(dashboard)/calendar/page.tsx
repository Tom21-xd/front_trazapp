'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { activitiesService } from '@/services';
import { Card, CardHeader, CardContent, Badge, useToast } from '@/components/ui';
import { cn, priorityColors, formatDate, relativeTime } from '@/lib/utils';
import type { Activity, Priority } from '@/types';

const WEEK_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEK_LABELS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const PRIORITY_DOT: Record<Priority, string> = {
  URGENTE: 'bg-red-500',
  ALTA: 'bg-orange-500',
  MEDIA: 'bg-yellow-500',
  BAJA: 'bg-green-500',
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Genera la matriz de días (6 filas × 7 columnas) para el mes dado.
 *  La primera celda corresponde al lunes de la semana en que cae el día 1. */
function buildMonthGrid(reference: Date): Date[] {
  const first = startOfMonth(reference);
  // getDay: 0 dom..6 sáb. Convertimos a 0 lun..6 dom
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export default function CalendarPage() {
  const toast = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await activitiesService.getAll();
        if (cancelled) return;
        setActivities(data.filter((a) => !!a.dueDate));
      } catch {
        toast.error('No se pudieron cargar las actividades');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);

  // Agrupa actividades por día (YYYY-MM-DD)
  const byDay = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      if (!a.dueDate) continue;
      const d = new Date(a.dueDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [activities]);

  const keyFor = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const today = new Date();
  const cursorMonth = cursor.getMonth();
  const cursorYear = cursor.getFullYear();

  const goPrev = () =>
    setCursor(new Date(cursorYear, cursorMonth - 1, 1));
  const goNext = () =>
    setCursor(new Date(cursorYear, cursorMonth + 1, 1));
  const goToday = () => {
    const t = new Date();
    setCursor(startOfMonth(t));
    setSelectedDay(t);
  };

  const selectedActivities = selectedDay
    ? (byDay.get(keyFor(selectedDay)) ?? []).slice().sort((a, b) => {
        const pa = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA'].indexOf(a.priority);
        const pb = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA'].indexOf(b.priority);
        return pa - pb;
      })
    : [];

  // Próximas a vencer del mes en curso (ordenadas)
  const upcomingThisMonth = useMemo(
    () =>
      activities
        .filter((a) => {
          if (!a.dueDate) return false;
          const d = new Date(a.dueDate);
          return (
            d.getFullYear() === cursorYear && d.getMonth() === cursorMonth
          );
        })
        .sort(
          (a, b) =>
            new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
        ),
    [activities, cursorYear, cursorMonth],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-bold text-accent-900">
              Calendario
            </h1>
            <p className="text-xs lg:text-sm text-accent-500">
              {upcomingThisMonth.length} con vencimiento en este mes
            </p>
          </div>
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-1.5 rounded-lg border border-accent-200 hover:bg-accent-50 text-sm text-accent-700 font-medium shrink-0"
          >
            Hoy
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="p-2 rounded-lg border border-accent-200 hover:bg-accent-50 text-accent-700"
            aria-label="Mes anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-base lg:text-lg font-semibold text-accent-900 text-center flex-1">
            {MONTH_LABELS[cursorMonth]} {cursorYear}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="p-2 rounded-lg border border-accent-200 hover:bg-accent-50 text-accent-700"
            aria-label="Mes siguiente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {/* Cabecera días de la semana — corta en móvil, completa en sm+ */}
            <div className="grid grid-cols-7 border-b border-accent-200 bg-accent-50">
              {WEEK_LABELS.map((d, i) => (
                <div
                  key={d + i}
                  className="px-1 sm:px-2 py-2 text-center text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-accent-500"
                >
                  <span className="sm:hidden">{WEEK_LABELS_SHORT[i]}</span>
                  <span className="hidden sm:inline">{d}</span>
                </div>
              ))}
            </div>

            {/* Grilla de días */}
            <div className="grid grid-cols-7">
              {grid.map((day) => {
                const inMonth = day.getMonth() === cursorMonth;
                const isToday = sameDay(day, today);
                const isSelected =
                  selectedDay !== null && sameDay(day, selectedDay);
                const items = byDay.get(keyFor(day)) ?? [];
                const overdue =
                  items.length > 0 &&
                  day.getTime() < today.getTime() &&
                  !isToday;
                return (
                  <button
                    key={keyFor(day)}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'min-h-12 sm:min-h-[88px] lg:min-h-[110px] text-left p-1 sm:p-1.5 border-b border-r border-accent-100 transition-colors flex flex-col gap-1',
                      !inMonth && 'bg-accent-50/40',
                      isSelected
                        ? 'bg-primary-50 ring-2 ring-primary-500 ring-inset'
                        : 'hover:bg-accent-50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center text-[11px] sm:text-xs font-semibold w-5 h-5 sm:w-6 sm:h-6 rounded-full',
                          isToday
                            ? 'bg-primary-600 text-white'
                            : inMonth
                              ? 'text-accent-700'
                              : 'text-accent-400',
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {items.length > 0 && (
                        <span
                          className={cn(
                            'text-[9px] sm:text-[10px] font-medium px-1 sm:px-1.5 rounded-full leading-tight',
                            overdue
                              ? 'bg-red-100 text-red-700'
                              : 'bg-primary-100 text-primary-700',
                          )}
                        >
                          {items.length}
                        </span>
                      )}
                    </div>
                    {/* En móvil sólo puntitos de prioridad (más legible que truncar nombres) */}
                    {items.length > 0 && (
                      <div className="flex sm:hidden items-center gap-0.5 flex-wrap">
                        {items.slice(0, 4).map((a) => (
                          <span
                            key={a.id}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              PRIORITY_DOT[a.priority],
                            )}
                          />
                        ))}
                      </div>
                    )}
                    {/* En sm+ títulos truncados */}
                    <div className="hidden sm:block space-y-0.5 overflow-hidden">
                      {items.slice(0, 3).map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-1.5 text-[11px] text-accent-700 truncate"
                          title={a.title}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              PRIORITY_DOT[a.priority],
                            )}
                          />
                          <span className="truncate">{a.title}</span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-[10px] text-accent-500">
                          +{items.length - 3} más
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Panel lateral con el detalle del día seleccionado */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-accent-900">
              {selectedDay
                ? formatDate(selectedDay)
                : 'Selecciona un día'}
            </h2>
            <p className="text-xs text-accent-500">
              {selectedDay
                ? `${selectedActivities.length} ${
                    selectedActivities.length === 1
                      ? 'actividad'
                      : 'actividades'
                  } con fecha límite`
                : 'Click sobre cualquier día para ver detalle'}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedDay ? (
              <p className="p-6 text-center text-sm text-accent-500">
                Nada seleccionado todavía.
              </p>
            ) : selectedActivities.length === 0 ? (
              <p className="p-6 text-center text-sm text-accent-500">
                Sin vencimientos este día.
              </p>
            ) : (
              <div className="divide-y divide-accent-100 max-h-[60vh] overflow-y-auto">
                {selectedActivities.map((a) => (
                  <Link
                    key={a.id}
                    href={`/activities/${a.id}`}
                    className="block p-4 hover:bg-accent-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-accent-900 truncate">
                        {a.title}
                      </p>
                      <Badge className={priorityColors[a.priority]} size="sm">
                        {a.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-accent-500 mt-1 truncate">
                      {a.project?.name}
                    </p>
                    {a.dueDate && (
                      <p className="text-[11px] text-accent-400 mt-1">
                        Vence {relativeTime(a.dueDate)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
