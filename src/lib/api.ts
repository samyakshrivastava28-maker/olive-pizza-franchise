import { Capacitor } from '@capacitor/core';
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
  return PRODUCTION_BACKEND_URL;
}

export function getApiUrl(endpoint: string = ''): string {
  const clean = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    return baseUrl.replace(/\/+$/, '') + clean;
  }
  return clean;
}

export interface CacheOptions {
  ttlMs?: number;
  forceRefresh?: boolean;
}

const inFlightRequests = new Map<string, Promise<any>>();
const memoryCache = new Map<string, { data: any; expiresAt: number }>();

export function invalidateFranchiseCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
      memoryCache.delete(key);
    }
  }
}

export async function fetchApi(
  endpoint: string,
  options: RequestInit = {},
  cacheOptions?: CacheOptions
): Promise<any> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const cleanKey = `GET:${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const ttlMs = cacheOptions?.ttlMs ?? 0;
  const forceRefresh = cacheOptions?.forceRefresh ?? false;

  if (isGet && !forceRefresh && ttlMs > 0) {
    const cached = memoryCache.get(cleanKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  if (isGet && !forceRefresh && inFlightRequests.has(cleanKey)) {
    return inFlightRequests.get(cleanKey);
  }

  const executionPromise = (async () => {
    const url = getApiUrl(endpoint);
    const franchiseId = localStorage.getItem('franchise_id') || '';

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('X-App-Target')) {
      headers.set('X-App-Target', 'FRANCHISE_MANAGER');
    }
    if (!headers.has('X-App-Source')) {
      headers.set('X-App-Source', 'FRANCHISE_MANAGER');
    }
    headers.set('x-franchise-id', franchiseId);
    const deviceId = localStorage.getItem('franchise_device_id') || `dev_fra_${franchiseId}`;
    headers.set('x-device-id', deviceId);
    
    const token = await getCurrentAuthToken().catch(() => null);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 429) {
        const data = await res.json().catch(() => null);
        return {
          success: false,
          code: 'AUTH_RATE_LIMITED',
          error: data?.message || 'Too many attempts from this device. Please try again later.',
          message: data?.message || 'Too many attempts from this device. Please try again later.',
          retryAfter: data?.retryAfter || data?.retryAfterSeconds || 120
        };
      }
      if (res.status === 401) {
        return { success: false, error: 'Authentication expired or invalid. Please sign in again.' };
      }
      if (res.status === 403) {
        return { success: false, error: 'Unauthorized. You do not have franchise management permissions.' };
      }
      const data = await res.json().catch(() => null);
      const result = data || { success: res.ok };

      if (isGet && ttlMs > 0) {
        memoryCache.set(cleanKey, {
          data: result,
          expiresAt: Date.now() + ttlMs,
        });
      }

      return result;
    } catch (err: any) {
      console.warn('[Franchise API Notice]:', err?.message);
      return { success: false, error: err?.message || 'Network connection error' };
    } finally {
      inFlightRequests.delete(cleanKey);
    }
  })();

  if (isGet) {
    inFlightRequests.set(cleanKey, executionPromise);
  }

  return executionPromise;
}
