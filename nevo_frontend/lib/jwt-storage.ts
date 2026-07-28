// Canonical auth storage lives in auth-storage.ts.
// This file exists only as a thin compatibility wrapper around legacy JWT helpers.
// New code should import from auth-storage.ts directly.

import { clearToken, getToken } from './auth-storage';

export function getStoredAccessToken(): string | null {
  return getToken();
}

export function clearJwt(): void {
  clearToken();
}
