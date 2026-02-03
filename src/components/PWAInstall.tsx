'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show install banner after a delay
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed
  if (isStandalone) return null;

  // iOS install instructions
  if (isIOS && showInstallBanner) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-2xl shadow-2xl border border-accent-200 p-4 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-accent-900 text-sm">Instalar TrazApp</h3>
            <p className="text-xs text-accent-500 mt-1">
              Toca <span className="inline-flex items-center"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg></span> y luego &quot;Agregar a inicio&quot;
            </p>
          </div>
          <button
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

  // Standard install banner
  if (!showInstallBanner || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-2xl shadow-2xl border border-accent-200 overflow-hidden z-50 animate-in slide-in-from-bottom duration-300">
      <div className="h-1 bg-gradient-to-r from-primary-500 via-white to-secondary-500" />
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30">
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
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-accent-600 bg-accent-100 hover:bg-accent-200 rounded-xl transition-colors"
          >
            Ahora no
          </button>
          <button
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

// Hook for registering service worker
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registrado:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available, show update prompt
                  if (confirm('Nueva versión disponible. ¿Actualizar ahora?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Error registrando SW:', error);
        });
    }
  }, []);
}
