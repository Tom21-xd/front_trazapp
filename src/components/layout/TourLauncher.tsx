'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import {
  hasSeen,
  resetSeen,
  startTour,
  tourTitle,
  type TourName,
} from '@/lib/tours';
import { generateUserManualPdf } from '@/lib/user-manual';
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastAutoRef = useRef<string | null>(null);
  // Posición del dropdown anclada al viewport, calculada desde el botón
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(
    null,
  );

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

  // Cerrar dropdown al click fuera / Esc + posicionamiento del portal
  useEffect(() => {
    if (!open) return;

    // Coordenadas iniciales basadas en el trigger
    const updatePos = () => {
      const t = triggerRef.current;
      if (!t) return;
      const rect = t.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    updatePos();

    // `pointerdown` (no `mousedown`) para cierre fiable en táctil/PWA.
    const onDocPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      // El dropdown está portalizado al body, así que lo detectamos por su id
      const dropdown = document.getElementById('tour-launcher-dropdown');
      if (dropdown?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
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
        ref={triggerRef}
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

      {open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="tour-launcher-dropdown"
            style={{
              position: 'fixed',
              top: coords.top,
              right: coords.right,
            }}
            className="w-72 max-w-[calc(100vw-1rem)] bg-white border border-accent-200 rounded-xl shadow-xl z-60 overflow-hidden"
          >
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
                        'w-full text-left px-4 py-2.5 text-sm text-accent-700 hover:bg-accent-50 transition-colors flex items-center justify-between gap-2',
                      )}
                    >
                      <span className="truncate">{tourTitle(t)}</span>
                      {hasSeen(t) && (
                        <span className="text-[10px] text-primary-600 font-medium shrink-0">
                          VISTO
                        </span>
                      )}
                    </button>
                  </li>
                ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void generateUserManualPdf().catch(() => undefined);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-accent-700 hover:bg-accent-50 transition-colors flex items-center gap-2 border-t border-accent-100"
            >
              <svg
                className="w-4 h-4 text-accent-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Descargar manual completo (PDF)
            </button>
            <div className="px-4 py-2 border-t border-accent-100 text-[11px] text-accent-500">
              Los tours se inician solos la primera vez que entras a cada página.
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
