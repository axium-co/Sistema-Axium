const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let _authToken: string | null = localStorage.getItem('auth_token');
let _onAuthError: (() => void) | null = null;
let _isRedirecting = false;
let _stopped = false;

export function setAuthToken(token: string | null) {
  _authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken(): string | null {
  return _authToken;
}

export function resetAuthFlags() {
  _isRedirecting = false;
  _stopped = false;
}

export function setOnAuthError(handler: (() => void) | null) {
  _onAuthError = handler;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<T> {
  if (_stopped) {
    throw new ApiError('Sessão expirada. Faça login novamente.', 401);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 && !_isRedirecting) {
      _isRedirecting = true;
      _stopped = true;
      setAuthToken(null);
      _onAuthError?.();
      throw new ApiError('Sessão expirada. Faça login novamente.', 401);
    }

    if (!response.ok) {
      if (response.status === 429 && retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return request<T>(endpoint, options, retryCount + 1);
      }
      const body = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new ApiError(body.error || `Erro ${response.status}`, response.status);
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Requisição cancelada por timeout.', 408);
    }
    throw err;
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt?: string;
  };
}

export interface MeResponse {
  user: AuthResponse['user'];
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/login', { email, password });
}

export async function registerApi(email: string, password: string, name: string, role?: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register', { email, password, name, role });
}

export async function getMe(): Promise<MeResponse> {
  return api.get<MeResponse>('/auth/me');
}

export { ApiError };
