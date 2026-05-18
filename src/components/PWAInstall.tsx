'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const SW_UPDATE_EVENT = 'trazapp:sw-update';

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  // Detección client-only en el inicializador (evita setState dentro del effect)
  const [isIOS] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return (
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  });
  const [isStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true
    );
  });

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS && !isStandalone && !dismissed) {
      iosTimer = setTimeout(() => setShowInstallBanner(true), 3000);
    }

    const handleInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleInstalled);

    // Nueva versión del service worker disponible (banner propio)
    const handleSwUpdate = () => setUpdateReady(true);
    window.addEventListener(SW_UPDATE_EVENT, handleSwUpdate);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener(SW_UPDATE_EVENT, handleSwUpdate);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [isIOS, isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleApplyUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  // 1) Banner propio de "nueva versión" — se muestra incluso instalada
  if (updateReady) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-2xl shadow-2xl border border-accent-200 overflow-hidden pb-safe z-60 animate-in slide-in-from-bottom duration-300">
        <div className="h-1 bg-linear-to-r from-primary-500 via-white to-secondary-500" />
        <div className="p-4">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-accent-900">Nueva versión disponible</h3>
              <p className="text-sm text-accent-500 mt-0.5">
                Actualiza para obtener las últimas mejoras.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setUpdateReady(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-accent-600 bg-accent-100 hover:bg-accent-200 rounded-xl transition-colors"
            >
              Después
            </button>
            <button
              type="button"
              onClick={handleApplyUpdate}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No mostrar banners de instalación si ya está instalada
  if (isStandalone) return null;

  // 2) Instrucciones de instalación iOS (Safari no dispara beforeinstallprompt)
  if (isIOS && showInstallBanner) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-2xl shadow-2xl border border-accent-200 p-4 pb-safe z-60 animate-in slide-in-from-bottom duration-300">
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-accent-900 text-sm">Instalar TrazApp</h3>
            <p className="text-xs text-accent-500 mt-1">
              Toca{' '}
              <span className="inline-flex items-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
              </span>{' '}
              y luego &quot;Agregar a inicio&quot;
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={handleDismiss}
            className="p-1 text-accent-400 hover:text-accent-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // 3) Banner de instalación estándar (Android / Chrome / Edge)
  if (!showInstallBanner || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-2xl shadow-2xl border border-accent-200 overflow-hidden pb-safe z-60 animate-in slide-in-from-bottom duration-300">
      <div className="h-1 bg-gradient-to-r from-primary-500 via-white to-secondary-500" />
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-accent-900">Instalar TrazApp</h3>
            <p className="text-sm text-accent-500 mt-0.5">
              Accede más rápido desde tu pantalla de inicio
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-accent-600 bg-accent-100 hover:bg-accent-200 rounded-xl transition-colors"
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}

// Registro del service worker + detección de nueva versión
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // En desarrollo / localhost el SW solo causa problemas: cachea bundles
    // JS viejos (cache-first) y sirve código obsoleto aunque recompiles.
    // Por eso aquí NO se registra y, además, se auto-limpia cualquier SW
    // o caché previo para que el navegador deje de servir código stale.
    const isLocalDev =
      process.env.NODE_ENV !== 'production' ||
      ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

    if (isLocalDev) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => undefined);
      if ('caches' in window) {
        caches
          .keys()
          .then((keys) => keys.forEach((k) => caches.delete(k)))
          .catch(() => undefined);
      }
      return;
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    );

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        const notifyIfUpdate = (worker: ServiceWorker | null) => {
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (
              worker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT));
            }
          });
        };

        // Ya hay un worker esperando (actualización pendiente)
        if (registration.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT));
        }
        registration.addEventListener('updatefound', () => {
          notifyIfUpdate(registration.installing);
        });
      })
      .catch((error) => {
        console.error('Error registrando SW:', error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      );
    };
  }, []);
}
