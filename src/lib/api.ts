const API_BASE = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : `http://localhost:3001${import.meta.env.VITE_API_URL || ''}`;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.token || null;
    }
  } catch {
    return null;
  }
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new ApiError(body.error || `Erro ${response.status}`, response.status);
  }

  return response.json();
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
