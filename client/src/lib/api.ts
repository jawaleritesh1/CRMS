export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    target?: string;
    details?: Array<{ field?: string; issue: string }>;
    correlationId: string;
  };
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('ralix_access_token');
      this.refreshToken = localStorage.getItem('ralix_refresh_token');
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ralix_access_token', accessToken);
      localStorage.setItem('ralix_refresh_token', refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ralix_access_token');
      localStorage.removeItem('ralix_refresh_token');
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    const correlationId = `web_${Math.random().toString(36).substring(2, 10)}`;
    headers.set('X-Correlation-ID', correlationId);

    const config: RequestInit = {
      signal: options.signal || AbortSignal.timeout(8000),
      ...options,
      headers,
    };

    let response: Response;
    try {
      response = await fetch(endpoint, config);
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError' || fetchErr.name === 'TimeoutError' || fetchErr.message?.includes('timeout')) {
        throw new Error('Database/Server connection timed out');
      }
      throw fetchErr;
    }

    // 401 Interceptor: Attempt rotating refresh
    if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh')) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const refreshRes = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: this.refreshToken }),
          });

          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data?.accessToken) {
            this.setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);
            this.isRefreshing = false;
            this.onTokenRefreshed(refreshData.data.accessToken);
          } else {
            this.clearTokens();
            this.isRefreshing = false;
            if (typeof window !== 'undefined') window.location.href = '/login';
            throw new Error('Session expired');
          }
        } catch (err) {
          this.clearTokens();
          this.isRefreshing = false;
          if (typeof window !== 'undefined') window.location.href = '/login';
          throw err;
        }
      }

      // Wait for token refresh completion
      const retryToken = await new Promise<string>((resolve) => {
        this.addRefreshSubscriber(resolve);
      });

      headers.set('Authorization', `Bearer ${retryToken}`);
      response = await fetch(endpoint, { ...options, headers });
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = payload?.error?.message || `HTTP ${response.status}: Request failed`;
      throw new Error(errorMessage);
    }

    return payload?.data !== undefined ? payload.data : payload;
  }
}

export const api = new ApiClient();
