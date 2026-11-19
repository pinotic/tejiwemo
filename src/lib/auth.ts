import type { AuthUser } from '../types';

const AUTH_TOKEN_KEY = 'portal_warga_auth_token';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getStoredAuthToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await authFetch('/api/auth/me');
  if (!res.ok) return null;
  const data = (await res.json()) as { user?: AuthUser };
  return data.user ?? null;
}

export async function loginWithCredentials(
  username: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = (await res.json()) as { user?: AuthUser; token?: string; error?: string };
  if (!res.ok || !data.user || !data.token) {
    throw new Error(data.error || 'Gagal masuk ke portal pengurus.');
  }
  setStoredAuthToken(data.token);
  return { user: data.user, token: data.token };
}

export async function logoutSession(): Promise<void> {
  try {
    await authFetch('/api/auth/logout', { method: 'POST' });
  } finally {
    setStoredAuthToken(null);
  }
}
