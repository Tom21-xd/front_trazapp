import api from '@/lib/api';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', data);
    api.setTokens(res.accessToken, res.refreshToken);
    return res;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', data);
    api.setTokens(res.accessToken, res.refreshToken);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      api.clearTokens();
    }
  },

  async getProfile(): Promise<User> {
    return api.get<User>('/auth/me');
  },

  async updateProfile(data: {
    name?: string;
    phone?: string;
    avatar?: string;
  }): Promise<User> {
    return api.patch<User>('/auth/me', data);
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/forgot-password', { email });
  },

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password', {
      token,
      password,
    });
  },

  isAuthenticated: () => api.isAuthenticated(),
};
