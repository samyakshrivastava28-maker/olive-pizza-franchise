import { getCurrentAuthToken } from './firebase';

export const PRODUCTION_BACKEND_URL = "https://olivepizza-owner.onrender.com";
export const DEV_BACKEND_URL = "http://localhost:5000";

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (import.meta.env.PROD) {
    return PRODUCTION_BACKEND_URL;
  }
  return DEV_BACKEND_URL;
}

export function getApiUrl(endpoint: string = ''): string {
  const clean = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    return baseUrl.replace(/\/+$/, '') + clean;
  }
  return clean;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = getApiUrl(endpoint);
  const franchiseId = localStorage.getItem('franchise_id') || 'fra_primary';

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('x-franchise-id', franchiseId);
  
  const token = await getCurrentAuthToken().catch(() => null);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      return { success: false, error: 'Authentication expired or invalid. Please sign in again.' };
    }
    if (res.status === 403) {
      return { success: false, error: 'Unauthorized. You do not have franchise management permissions.' };
    }
    const data = await res.json().catch(() => null);
    return data || { success: res.ok };
  } catch (err: any) {
    console.warn('[Franchise API Notice]:', err?.message);
    return { success: false, error: err?.message || 'Network connection error' };
  }
}
