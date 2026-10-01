import {
  authResponseSchema,
  currentUserSchema,
  googleStartResponseSchema,
  userDataExportSchema,
  type AuthResponse,
  type CurrentUser,
  type GoogleStartResponse,
  type UserDataExport,
} from '@hair-analysis/shared';
import { request } from './client';

export function register(email: string, password: string, lgpdConsent: boolean): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', { method: 'POST', body: { email, password, lgpdConsent } }).then(
    (r) => authResponseSchema.parse(r),
  );
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } }).then((r) =>
    authResponseSchema.parse(r),
  );
}

export function loginAsGuest(deviceId: string, lgpdConsent: boolean): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/guest', { method: 'POST', body: { deviceId, lgpdConsent } }).then((r) =>
    authResponseSchema.parse(r),
  );
}

export function googleStart(redirectUri: string, accessToken?: string): Promise<GoogleStartResponse> {
  return request<GoogleStartResponse>('/api/auth/google/start', {
    method: 'POST',
    accessToken,
    body: { redirectUri, lgpdConsent: true },
  }).then((r) => googleStartResponseSchema.parse(r));
}

export function googleExchange(code: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/google/exchange', { method: 'POST', body: { code } }).then((r) =>
    authResponseSchema.parse(r),
  );
}

export function upgradeGuest(accessToken: string, email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/me/upgrade', {
    method: 'POST',
    accessToken,
    body: { email, password, lgpdConsent: true },
  }).then((r) => authResponseSchema.parse(r));
}

export function refresh(refreshToken: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/refresh', { method: 'POST', body: { refreshToken } }).then((r) =>
    authResponseSchema.parse(r),
  );
}

export function setPremium(accessToken: string, isPremium: boolean): Promise<CurrentUser> {
  return request<CurrentUser>('/api/me/premium', {
    method: 'PATCH',
    accessToken,
    body: { isPremium },
  }).then((r) => currentUserSchema.parse(r));
}

export function exportMyData(accessToken: string): Promise<UserDataExport> {
  return request<UserDataExport>('/api/me/export', { accessToken }).then((r) => userDataExportSchema.parse(r));
}

export function deleteMyAccount(accessToken: string): Promise<void> {
  return request<void>('/api/me', { method: 'DELETE', accessToken });
}
