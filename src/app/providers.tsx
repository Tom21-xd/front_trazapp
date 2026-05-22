'use client';

import { type ReactNode } from 'react';
import { ToastProvider } from '@/components/ui';
import { PWAInstall, useServiceWorker } from '@/components/PWAInstall';
import { ThemeProvider } from '@/store/ThemeContext';

function ServiceWorkerRegistration() {
  useServiceWorker();
  return null;
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ServiceWorkerRegistration />
        {children}
        <PWAInstall />
      </ToastProvider>
    </ThemeProvider>
  );
}
