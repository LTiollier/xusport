// XuSport — API client (matches backend/API.md)
import type {
  DashboardStats,
  Exercise,
  ProgressionPoint,
  SessionLog,
  SessionModel,
  SyncBundle,
  UserProfile,
  UserSettings,
} from './types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const TOKEN_KEY = 'xusport_token';

export const auth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
  isAuthed(): boolean {
    return !!this.getToken();
  },
};

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  withAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (withAuth) {
    const token = auth.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const msg =
      (body as { message?: string } | null)?.message ||
      `Request failed: ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }
  return body as T;
}

interface DataEnvelope<T> {
  data: T;
}

export interface ModelInput {
  name: string;
  exercises: Array<{
    exercise_id: number | string;
    sets_count: number;
    goal_type: 'fixed' | 'max';
    goal_value: number | null;
    rest_time: number;
    order: number;
  }>;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string }>(
      '/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      false,
    ),
  logout: () => request<void>('/logout', { method: 'POST' }),
  me: () => request<{ data: UserProfile }>('/user'),

  // Sync (used on login to hydrate local cache)
  sync: () => request<SyncBundle>('/sync'),

  // Exercises
  exercises: () => request<DataEnvelope<Exercise[]>>('/exercises'),
  exercise: (id: number | string) =>
    request<DataEnvelope<Exercise>>(`/exercises/${id}`),

  // Models
  models: () => request<DataEnvelope<SessionModel[]>>('/models'),
  model: (id: number | string) =>
    request<DataEnvelope<SessionModel>>(`/models/${id}`),
  createModel: (body: ModelInput) =>
    request<DataEnvelope<SessionModel>>('/models', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateModel: (id: number | string, body: ModelInput) =>
    request<DataEnvelope<SessionModel>>(`/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteModel: (id: number | string) =>
    request<void>(`/models/${id}`, { method: 'DELETE' }),

  // History
  history: () => request<DataEnvelope<SessionLog[]>>('/history'),
  log: (id: number | string) =>
    request<DataEnvelope<SessionLog>>(`/history/${id}`),
  createLog: (body: {
    session_model_id: number | string;
    duration: number;
    completed_at: string;
    synced_at?: string;
    performance_logs: Array<{
      exercise_id: number | string;
      set_number: number;
      reps_done: number;
    }>;
  }) =>
    request<DataEnvelope<SessionLog>>('/history', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteLog: (id: number | string) =>
    request<void>(`/history/${id}`, { method: 'DELETE' }),

  // Stats
  dashboard: () => request<DashboardStats>('/stats/dashboard'),
  progression: (exerciseId: number | string) =>
    request<ProgressionPoint[]>(`/stats/progression/${exerciseId}`),

  // Profile & settings
  profile: () => request<UserProfile>('/user/profile'),
  updateSettings: (body: UserSettings) =>
    request<UserSettings>('/user/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};
