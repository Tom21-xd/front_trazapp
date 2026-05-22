'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'trazapp-theme';

// Store externo basado en el DOM: la clase `dark` del <html> es la fuente de
// verdad (la fija el script anti-FOUC del layout antes del primer paint).
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb); // sincroniza entre pestañas
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'light';
}

function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* almacenamiento no disponible (modo privado) */
  }
  emitChange();
}

/** Provider sin estado: el script del layout ya aplicó el tema. Se conserva
 *  por simetría con el resto de providers y para futuros ajustes. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}
