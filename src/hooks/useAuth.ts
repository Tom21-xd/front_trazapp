'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';
import type { User, LoginRequest, RegisterRequest } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (data: LoginRequest) => {
    const res = await authService.login(data);
    setUser(res.user);
    router.push('/dashboard');
    return res;
  };

  const register = async (data: RegisterRequest) => {
    const res = await authService.register(data);
    setUser(res.user);
    router.push('/dashboard');
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    refresh: loadUser,
  };
}
