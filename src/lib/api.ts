import { auth } from './firebase';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  let token: string | undefined;
  try {
    token = await auth.currentUser?.getIdToken();
  } catch {}

  const franchiseId = localStorage.getItem('franchise_id') || 'fra_rajnandgaon';

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('x-franchise-id', franchiseId);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    // Development fallback token for testing
    headers.set('Authorization', 'Bearer test-franchise-token');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn('[Franchise API Notice]:', err.message);
    return { success: false, error: err.message };
  }
}
