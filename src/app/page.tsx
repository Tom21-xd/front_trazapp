'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent-50">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
