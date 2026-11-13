import { OverridesDoc, ProductOverride } from '../utils/productOverrides';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...init });
  } catch {
    throw new ApiError('No connection. Check your internet and try again.', 0);
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // Not JSON (e.g. the API is not deployed): handled below
  }

  if (!res.ok || body === null) {
    throw new ApiError(body?.error || `The server did not respond correctly (HTTP ${res.status}).`, res.status);
  }
  return body as T;
}

const jsonRequest = (method: string, payload: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

export type ProductChange =
  | { op: 'set'; sku: string; fields: ProductOverride; custom?: boolean }
  | { op: 'delete' | 'restore' | 'reset'; sku: string };

export const adminApi = {
  session: () => call<{ configured: boolean; authenticated: boolean }>('/api/admin'),
  login: (password: string) => call<{ authenticated: boolean }>('/api/admin', jsonRequest('POST', { password })),
  logout: () => call<{ authenticated: boolean }>('/api/admin', { method: 'DELETE' }),
  loadOverrides: () => call<OverridesDoc>('/api/overrides?admin=1'),
  saveChange: (change: ProductChange) => call<OverridesDoc>('/api/overrides', jsonRequest('POST', change))
};
