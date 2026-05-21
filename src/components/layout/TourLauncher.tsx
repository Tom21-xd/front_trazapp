'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  hasSeen,
  resetSeen,
  startTour,
  tourTitle,
  type TourName,
} from '@/lib/tours';
import { cn } from '@/lib/utils';

const PATH_TO_TOUR: Array<{ match: RegExp; tour: TourName }> = [
  { match: /^\/dashboard\b/, tour: 'dashboard' },
  { match: /^\/board\b/, tour: 'board' },
  { match: /^\/activities\/[^/]+\/?$/, tour: 'activityDetail' },
];

function detectTour(pathname: string): TourName | null {
  for (const { match, tour } of PATH_TO_TOUR) {
    if (match.test(pathname)) return tour;
  }
  return null;
}

/**
 * Botón "Guía" que vive en el topbar y abre un dropdown con:
 *  - El tour de la página actual (si aplica).
 *  - Tours rápidos a otras vistas clave.
 *
 * Además, la primera vez que un usuario entra a una página con tour, lo
 * arranca solo (una sola vez por nombre, gracias a localStorage).
 */
export function TourLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastAutoRef = useRef<string | null>(null);

  // Auto-arranque del tour la primera vez que se visita la página
  useEffect(() => {
    const tour = detectTour(pathname);
    if (!tour) return;
    if (hasSeen(tour)) return;
    if (lastAutoRef.current === tour) return;
    lastAutoRef.current = tour;
    // Esperamos un tick para que la página termine de pintar antes de buscar
    // los selectores `[data-tour="..."]`.
    const t = window.setTimeout(() => startTour(tour), 600);
    return () => window.clearTimeout(t);
  }, [pathname]);

  // Cerrar dropdown al click fuera / Esc
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const currentTour = detectTour(pathname);

  // Lista de tours disponibles para mostrar en el menú
  const allTours: TourName[] = [
    'dashboard',
    'board',
    'activityDetail',
    'notifications',
  ];

  const launch = (name: TourName, force = false) => {
    setOpen(false);
    if (force) resetSeen(name);
    // pequeño delay para que el dropdown cierre antes del overlay
    window.setTimeout(() => startTour(name, { force }), 100);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir guía interactiva"
        title="Guía interactiva"
        className="p-2 rounded-lg text-accent-600 hover:text-accent-900 hover:bg-accent-100 transition-colors"
      >
        <svg
          className="w-5 h-5 lg:w-6 lg:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white border border-accent-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-accent-200">
            <h3 className="font-semibold text-sm text-accent-900">
              Guía interactiva
            </h3>
            <p className="text-xs text-accent-500 mt-0.5">
              Tour paso a paso por la app
            </p>
          </div>
          {currentTour && (
            <button
              type="button"
              onClick={() => launch(currentTour, true)}
              className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-accent-100"
            >
              <p className="text-sm font-semibold text-primary-700">
                ▶ Tour de esta página
              </p>
              <p className="text-xs text-accent-500 mt-0.5">
                {tourTitle(currentTour)}
              </p>
            </button>
          )}
          <ul className="max-h-72 overflow-y-auto">
            {allTours
              .filter((t) => t !== currentTour)
              .map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => launch(t, true)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm text-accent-700 hover:bg-accent-50 transition-colors',
                    )}
                  >
                    {tourTitle(t)}
                    {hasSeen(t) && (
                      <span className="ml-2 text-[10px] text-primary-600 font-medium">
                        VISTO
                      </span>
                    )}
                  </button>
                </li>
              ))}
          </ul>
          <div className="px-4 py-2 border-t border-accent-100 text-[11px] text-accent-500">
            Los tours se inician solos la primera vez que entras a cada página.
          </div>
        </div>
      )}
    </div>
  );
}
