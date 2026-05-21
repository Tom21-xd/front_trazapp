'use client';

import { driver, type Config, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

/**
 * Tours interactivos de la app usando driver.js.
 *
 * Cada tour es una lista de pasos que apuntan a elementos con
 * `data-tour="<id>"` en el DOM (más estable que clases o jerarquía).
 * Si el elemento no existe en la página actual el paso se omite
 * automáticamente (filtramos antes de arrancar el driver).
 */

export type TourName =
  | 'dashboard'
  | 'board'
  | 'activityDetail'
  | 'notifications';

const SEEN_KEY = (name: TourName) => `trazapp:tour:seen:${name}`;

export function hasSeen(name: TourName): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SEEN_KEY(name)) === '1';
  } catch {
    return false;
  }
}

export function markSeen(name: TourName) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SEEN_KEY(name), '1');
  } catch {
    /* quota o modo privado */
  }
}

export function resetSeen(name: TourName) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SEEN_KEY(name));
  } catch {
    /* noop */
  }
}

const BASE_CONFIG: Partial<Config> = {
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  nextBtnText: 'Siguiente →',
  prevBtnText: '← Anterior',
  doneBtnText: 'Listo',
  progressText: 'Paso {{current}} de {{total}}',
  popoverClass: 'trazapp-tour',
  allowClose: true,
  smoothScroll: true,
  overlayOpacity: 0.55,
};

const TOUR_TITLES: Record<TourName, string> = {
  dashboard: 'Tour del Dashboard',
  board: 'Tour del Tablero Kanban',
  activityDetail: 'Tour del detalle de actividad',
  notifications: 'Tour de notificaciones',
};

export function tourTitle(name: TourName): string {
  return TOUR_TITLES[name];
}

const TOUR_STEPS: Record<TourName, DriveStep[]> = {
  dashboard: [
    {
      element: '[data-tour="dashboard-greeting"]',
      popover: {
        title: 'Bienvenido a TrazApp',
        description:
          'Este es tu panel inicial. Aquí ves de un vistazo el estado del sistema y tus actividades pendientes.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="dashboard-kpis"]',
      popover: {
        title: 'Tus indicadores clave',
        description:
          'Pendientes, vencidas, sin asignar y solicitudes por revisar. Cada tarjeta es clickeable y te lleva a la vista correspondiente.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="dashboard-stages"]',
      popover: {
        title: 'Distribución por etapa',
        description:
          'Cuántas actividades activas hay en cada etapa del flujo. Útil para detectar cuellos de botella.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="sidebar-nav"]',
      popover: {
        title: 'Navegación principal',
        description:
          'Aquí están las secciones: Proyectos, Tablero Kanban, Actividades, Mis tareas, Solicitudes. Lo que ves depende de tu rol.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-tour="bell"]',
      popover: {
        title: 'Notificaciones',
        description:
          'Cuando te asignan algo, alguien comenta o aprueban una solicitud, llega aquí en tiempo real. Activa también el push para recibir alertas en el celular.',
        side: 'bottom',
        align: 'end',
      },
    },
  ],
  board: [
    {
      element: '[data-tour="board-search"]',
      popover: {
        title: 'Buscador',
        description:
          'Filtra las tarjetas por título o descripción. Acepta acentos y mayúsculas indistintamente.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="board-filters"]',
      popover: {
        title: 'Filtros',
        description:
          'Acota por proyecto, asignado o prioridad. Tus filtros se guardan localmente entre sesiones.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="board-columns"]',
      popover: {
        title: 'Columnas = etapas del flujo',
        description:
          'Cada columna es una etapa. Las tarjetas se arrastran entre columnas para cambiar de etapa.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="board-card"]',
      popover: {
        title: 'Cada tarjeta es una actividad',
        description:
          'Click sobre la tarjeta para abrir el detalle. Si tienes permiso, también puedes arrastrarla a otra etapa. Como trabajador, el arrastre genera una solicitud de cambio.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="board-add"]',
      popover: {
        title: 'Añadir tarea',
        description:
          'Crea una nueva actividad directamente en la columna. Si eres admin puedes asignarla ya desde el modal.',
        side: 'top',
      },
    },
  ],
  activityDetail: [
    {
      element: '[data-tour="detail-hero"]',
      popover: {
        title: 'Cabecera de la actividad',
        description:
          'Título, prioridad, fecha límite, asignados y quién la creó. La franja izquierda toma el color de la etapa actual.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="detail-stepper"]',
      popover: {
        title: 'Flujo de etapas',
        description:
          'Toda la ruta del flujo se ve aquí, con la etapa actual destacada. Para mover la actividad pulsa "Solicitar cambio".',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="detail-description"]',
      popover: {
        title: 'Descripción',
        description:
          'Contexto, criterios o pasos. Editable con el botón Editar de la cabecera si tienes permiso.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="detail-comments"]',
      popover: {
        title: 'Comentarios y adjuntos',
        description:
          'Conversación de la actividad. Adjunta imágenes para verlas inline o documentos para descargar. Pasa el mouse sobre tus comentarios para editar o eliminar.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="detail-timeline"]',
      popover: {
        title: 'Trazabilidad completa',
        description:
          'Quién hizo qué y cuándo. Filtra por tipo (etapas, asignaciones, comentarios) y exporta a CSV para auditorías.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="detail-sidebar"]',
      popover: {
        title: 'Panel lateral',
        description:
          'Asignados, etiquetas, dependencias y resumen rápido. Como admin puedes gestionar asignados desde aquí mismo.',
        side: 'left',
      },
    },
  ],
  notifications: [
    {
      element: '[data-tour="bell"]',
      popover: {
        title: 'Tu campana',
        description:
          'El número rojo indica notificaciones sin leer. Llegan al instante por SSE — no esperas refresco manual.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="push-toggle"]',
      popover: {
        title: 'Notificaciones del dispositivo',
        description:
          'Activa este toggle para recibir alertas push en tu celular o computador, incluso con la pestaña cerrada. También llegan por correo institucional.',
        side: 'bottom',
      },
    },
  ],
};

function pickAvailableSteps(steps: DriveStep[]): DriveStep[] {
  if (typeof document === 'undefined') return steps;
  return steps.filter((s) => {
    const sel = typeof s.element === 'string' ? s.element : null;
    if (!sel) return true;
    return !!document.querySelector(sel);
  });
}

export function startTour(name: TourName, options?: { force?: boolean }) {
  const all = TOUR_STEPS[name];
  if (!all) return;
  const steps = pickAvailableSteps(all);
  if (steps.length === 0) return;

  const d = driver({
    ...BASE_CONFIG,
    steps,
    onDestroyed: () => {
      markSeen(name);
    },
  });
  if (options?.force) resetSeen(name);
  d.drive();
}
