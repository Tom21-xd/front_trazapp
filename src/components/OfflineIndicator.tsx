'use client';

import { useSyncExternalStore } from 'react';

/**
 * Banner persistente que aparece cuando la PWA / navegador pierde conexión.
 * En modo standalone (sin URL bar) es la única señal visible de que estamos
 * offline. Usa useSyncExternalStore para mantener hidratación consistente.
 */
function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function OfflineIndicator() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 top-3 z-[60] pointer-events-none"
    >
      <div className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent-900 text-white text-sm shadow-lg ring-1 ring-white/10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-500" />
        </span>
        <span>Sin conexión · Los cambios no se guardan</span>
      </div>
    </div>
  );
}
