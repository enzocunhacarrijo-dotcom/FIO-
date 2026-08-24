import {
  authResponseSchema,
  currentUserSchema,
  type AuthResponse,
  type CurrentUser,
  type ObjetivoPrincipal,
} from '@hair-analysis/shared';
import { request } from './client';

export function register(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', { method: 'POST', body: { email, password } }).then((r) =>
    authResponseSchema.parse(r),
  );
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } }).then((r) =>
    authResponseSchema.parse(r),
  );
}

export function loginAsGuest(deviceId: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/guest', { method: 'POST', body: { deviceId } }).then((r) =>
    authResponseSchema.parse(r),
  );
}

export function refresh(refreshToken: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/refresh', { method: 'POST', body: { refreshToken } }).then((r) =>
    authResponseSchema.parse(r),
  );
}

export function setObjetivoPrincipal(accessToken: string, objetivoPrincipal: ObjetivoPrincipal): Promise<CurrentUser> {
  return request<CurrentUser>('/api/me/objetivo', {
    method: 'PATCH',
    accessToken,
    body: { objetivoPrincipal },
  }).then((r) => currentUserSchema.parse(r));
}
