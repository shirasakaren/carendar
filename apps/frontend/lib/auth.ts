// Token-based admin session. The backend also sets an httpOnly cookie on
// /api/admin/auth, but cross-origin (3000 → 8080) browsers will only
// send a SameSite=Lax cookie on top-level navigation — not on the
// fetch() calls we use here. So we carry the bearer token in
// Authorization headers from localStorage. The cookie remains a useful
// backup for same-origin deployments.

const TOKEN_KEY = "mgm_admin_token";
const EXPIRES_KEY = "mgm_admin_expires";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, expiresAtISO: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(EXPIRES_KEY, expiresAtISO);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(EXPIRES_KEY);
}

/** Cheap front-end probe — does NOT verify with the server. */
export function isLikelyAuthed(): boolean {
  const tok = getToken();
  if (!tok) return false;
  const exp = window.localStorage.getItem(EXPIRES_KEY);
  if (!exp) return true;
  return new Date(exp).getTime() > Date.now();
}
