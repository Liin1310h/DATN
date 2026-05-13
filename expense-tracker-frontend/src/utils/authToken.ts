import { parseJwt, type JwtPayload } from "./parseJwt";

const CLAIMS = {
  role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  userId:
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
} as const;

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

export function getPayload(token?: string | null): JwtPayload | null {
  const source = token ?? getToken();
  if (!source) return null;
  return parseJwt(source);
}

export function getRoleFromToken(token?: string | null): string | null {
  const payload = getPayload(token);
  if (!payload) return null;

  const role = payload.role ?? payload[CLAIMS.role];
  return typeof role === "string" ? role : null;
}

export function getUserIdFromToken(token?: string | null): number | null {
  const payload = getPayload(token);
  if (!payload) return null;

  const raw = payload[CLAIMS.userId] ?? payload.sub;
  if (typeof raw !== "string") return null;

  const id = Number(raw);
  return Number.isNaN(id) ? null : id;
}

export function getEmailFromToken(token?: string | null): string | null {
  const payload = getPayload(token);
  if (!payload) return null;

  const email = payload.email ?? payload[CLAIMS.email];
  return typeof email === "string" ? email : null;
}

export function isTokenExpired(token?: string | null): boolean {
  const payload = getPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;

  return payload.exp * 1000 <= Date.now();
}

export function isAuthenticated(token?: string | null): boolean {
  const source = token ?? getToken();
  if (!source) return false;

  return !isTokenExpired(source);
}

export function isAdmin(token?: string | null): boolean {
  return getRoleFromToken(token) === "Admin";
}

export function isUser(token?: string | null): boolean {
  return getRoleFromToken(token) === "User";
}
