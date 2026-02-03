const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const data = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
  ): Promise<T> {
    const { params, ...init } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) searchParams.append(k, String(v));
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res = await fetch(url, { ...init, headers });

    if (res.status === 401 && token) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        res = await fetch(url, { ...init, headers });
      } else {
        if (typeof window !== 'undefined') window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
  }

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);
export default api;
