import { Platform } from 'react-native';
import { Trip } from '../types';

// In dev on web, API is same origin. On native, point to the server.
const BASE_URL = Platform.OS === 'web' ? '' : 'http://localhost:3000';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  return res;
}

// Auth
export async function apiLogin(username: string, password: string): Promise<{ token: string; username: string }> {
  const res = await apiFetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Login failed');
  }
  const data = await res.json();
  authToken = data.token;
  return data;
}

export async function apiRegister(username: string, password: string): Promise<{ token: string; username: string }> {
  const res = await apiFetch('/api/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Registration failed');
  }
  const data = await res.json();
  authToken = data.token;
  return data;
}

export async function apiLogout(): Promise<void> {
  await apiFetch('/api/logout', { method: 'POST' });
  authToken = null;
}

export async function apiGetMe(): Promise<{ username: string } | null> {
  const res = await apiFetch('/api/me');
  if (!res.ok) return null;
  return res.json();
}

// Trips
export async function apiGetTrips(): Promise<Trip[]> {
  const res = await apiFetch('/api/trips');
  if (!res.ok) throw new Error('Failed to load trips');
  return res.json();
}

export async function apiAddTrip(trip: Trip): Promise<void> {
  const res = await apiFetch('/api/trips', {
    method: 'POST',
    body: JSON.stringify(trip),
  });
  if (!res.ok) throw new Error('Failed to add trip');
}

export async function apiUpdateTrip(trip: Trip): Promise<void> {
  const res = await apiFetch(`/api/trips/${trip.id}`, {
    method: 'PUT',
    body: JSON.stringify(trip),
  });
  if (!res.ok) throw new Error('Failed to update trip');
}

export async function apiDeleteTrip(tripId: string): Promise<void> {
  const res = await apiFetch(`/api/trips/${tripId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete trip');
}
