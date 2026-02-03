'use client';

import { AuthProvider } from '@/store/AuthContext';
import { DashboardLayout } from '@/components/layout';

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProvider>
  );
}
