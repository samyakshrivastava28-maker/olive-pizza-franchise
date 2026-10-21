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
  if (typeof window !== 'undefined' && !Capacitor.isNativePlatform() && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return DEV_BACKEND_URL;
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
  persist?: boolean;
  swr?: boolean;
  onFreshData?: (data: any) => void;
}

// Canonical TTLs in milliseconds matching Backend Redis Layerbase cache
export const CLIENT_CACHE_TTL = {
  RESTAURANT_STATUS: 60 * 1000,    // 60s (1 min)
  TELEMETRY: 60 * 1000,           // 60s (1 min)
  BRANCH_RESTAURANTS: 180 * 1000, // 180s (3 min)
  POS_ACCOUNTS: 180 * 1000,       // 180s (3 min)
  BRANCH_MENU: 300 * 1000,        // 300s (5 min)
  MASTER_CATALOG: 300 * 1000,     // 300s (5 min)
  APP_CONFIG: 600 * 1000,         // 600s (10 min)
};

const STORAGE_PREFIX = 'op_fra_cache_';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  timestamp: number;
}

const inFlightRequests = new Map<string, Promise<any>>();
const memoryCache = new Map<string, CacheEntry<any>>();

function getCachedEntry<T>(key: string): CacheEntry<T> | null {
  const mem = memoryCache.get(key);
  if (mem) return mem;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        memoryCache.set(key, parsed);
        return parsed;
      }
    } catch {}
  }
  return null;
}

function setCachedEntry<T>(key: string, data: T, ttlMs: number, persist: boolean = true): void {
  const now = Date.now();
  const entry: CacheEntry<T> = {
    data,
    timestamp: now,
    expiresAt: now + ttlMs,
  };
  memoryCache.set(key, entry);

  if (persist && typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {}
  }
}

export function invalidateFranchiseCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) keysToRemove.push(k);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch {}
    }
    return;
  }

  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          const bare = k.replace(STORAGE_PREFIX, '');
          if (regex.test(bare)) keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }
}

export function invalidateMenuCache(branchId?: string): void {
  if (branchId) {
    invalidateFranchiseCache(new RegExp(`menu.*${branchId}`));
  } else {
    invalidateFranchiseCache(/menu/);
  }
}

export function invalidateBranchCache(): void {
  invalidateFranchiseCache(/(restaurants|telemetry|pos-accounts)/);
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
  const persist = cacheOptions?.persist ?? true;
  const enableSwr = cacheOptions?.swr ?? true;

  // 1. Check multi-tier cache
  const cachedEntry = isGet && ttlMs > 0 ? getCachedEntry<any>(cleanKey) : null;
  const isFresh = cachedEntry ? Date.now() < cachedEntry.expiresAt : false;

  // 1a. Fresh cache hit -> immediate return (0ms)
  if (isGet && !forceRefresh && cachedEntry && isFresh) {
    return cachedEntry.data;
  }

  // 2. Request deduplication for simultaneous in-flight calls
  if (isGet && !forceRefresh && inFlightRequests.has(cleanKey)) {
    if (cachedEntry && enableSwr) {
      return cachedEntry.data;
    }
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
        setCachedEntry(cleanKey, result, ttlMs, persist);
        if (cacheOptions?.onFreshData) {
          try {
            cacheOptions.onFreshData(result);
          } catch (e) {
            console.warn(`[fetchApi] onFreshData handler error for ${cleanKey}:`, e);
          }
        }
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

  // 3. Stale-While-Revalidate: Return stale cached data immediately (0ms) while background fetch updates
  if (isGet && !forceRefresh && cachedEntry && enableSwr) {
    return cachedEntry.data;
  }

  return executionPromise;
}

// ─── FRANCHISE TYPED HELPERS ──────────────────────────────────────────────────

export async function fetchFranchiseRestaurants(
  franchiseId: string,
  forceRefresh = false,
  onFreshData?: (data: any) => void
): Promise<any> {
  return fetchApi(
    `/api/franchises/${encodeURIComponent(franchiseId)}/restaurants`,
    { method: 'GET' },
    {
      ttlMs: CLIENT_CACHE_TTL.BRANCH_RESTAURANTS, // 180s (3 min)
      forceRefresh,
      swr: true,
      onFreshData,
    }
  );
}

export async function fetchBranchMenuManagement(
  branchId: string,
  forceRefresh = false,
  onFreshData?: (data: any) => void
): Promise<any> {
  return fetchApi(
    `/api/menu/branch/${encodeURIComponent(branchId)}/management`,
    { method: 'GET' },
    {
      ttlMs: CLIENT_CACHE_TTL.BRANCH_MENU, // 300s (5 min) matching Redis Layerbase
      forceRefresh,
      swr: true,
      onFreshData,
    }
  );
}

export async function fetchMasterCatalog(forceRefresh = false): Promise<any> {
  return fetchApi(
    '/api/menu/master-catalog',
    { method: 'GET' },
    {
      ttlMs: CLIENT_CACHE_TTL.MASTER_CATALOG, // 300s (5 min) matching Redis Layerbase
      forceRefresh,
      swr: true,
    }
  );
}

export async function fetchAppConfig(appName: string, forceRefresh = false): Promise<any> {
  return fetchApi(
    `/api/config/${encodeURIComponent(appName)}`,
    { method: 'GET' },
    {
      ttlMs: CLIENT_CACHE_TTL.APP_CONFIG, // 600s (10 min) matching Redis Layerbase
      forceRefresh,
      swr: true,
    }
  );
}

