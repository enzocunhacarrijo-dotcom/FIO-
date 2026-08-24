import { create } from 'zustand';
import type { AuthResponse, CurrentUser, ObjetivoPrincipal } from '@hair-analysis/shared';
import * as authApi from '@/api/auth';
import { ApiError } from '@/api/client';
import { deleteItem, getItem, setItem } from '@/lib/secure-storage';

const KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  user: 'auth_user',
  deviceId: 'device_id',
} as const;

function generateDeviceId(): string {
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getItem(KEYS.deviceId);
  if (existing) return existing;
  const created = generateDeviceId();
  await setItem(KEYS.deviceId, created);
  return created;
}

async function persistAuth(auth: AuthResponse): Promise<void> {
  await setItem(KEYS.accessToken, auth.accessToken);
  await setItem(KEYS.refreshToken, auth.refreshToken);
  await setItem(KEYS.user, JSON.stringify(auth.user));
}

async function clearAuth(): Promise<void> {
  await deleteItem(KEYS.accessToken);
  await deleteItem(KEYS.refreshToken);
  await deleteItem(KEYS.user);
}

type AuthState = {
  status: 'loading' | 'ready';
  user: CurrentUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  busy: boolean;
  hydrate: () => Promise<void>;
  registerAccount: (email: string, password: string) => Promise<boolean>;
  loginAccount: (email: string, password: string) => Promise<boolean>;
  continueAsGuest: () => Promise<boolean>;
  setObjetivo: (objetivo: ObjetivoPrincipal) => Promise<boolean>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  refreshToken: null,
  error: null,
  busy: false,

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        getItem(KEYS.accessToken),
        getItem(KEYS.refreshToken),
        getItem(KEYS.user),
      ]);
      set({
        status: 'ready',
        accessToken,
        refreshToken,
        user: userJson ? (JSON.parse(userJson) as CurrentUser) : null,
      });
    } catch {
      set({ status: 'ready', accessToken: null, refreshToken: null, user: null });
    }
  },

  registerAccount: async (email, password) => {
    set({ busy: true, error: null });
    try {
      const auth = await authApi.register(email, password);
      await persistAuth(auth);
      set({ user: auth.user, accessToken: auth.accessToken, refreshToken: auth.refreshToken, busy: false });
      return true;
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Não foi possível criar sua conta.', busy: false });
      return false;
    }
  },

  loginAccount: async (email, password) => {
    set({ busy: true, error: null });
    try {
      const auth = await authApi.login(email, password);
      await persistAuth(auth);
      set({ user: auth.user, accessToken: auth.accessToken, refreshToken: auth.refreshToken, busy: false });
      return true;
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Não foi possível entrar.', busy: false });
      return false;
    }
  },

  continueAsGuest: async () => {
    set({ busy: true, error: null });
    try {
      const deviceId = await getOrCreateDeviceId();
      const auth = await authApi.loginAsGuest(deviceId);
      await persistAuth(auth);
      set({ user: auth.user, accessToken: auth.accessToken, refreshToken: auth.refreshToken, busy: false });
      return true;
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Não foi possível continuar sem conta.', busy: false });
      return false;
    }
  },

  setObjetivo: async (objetivo) => {
    const { accessToken } = get();
    if (!accessToken) {
      set({ error: 'Sessão inválida. Entre novamente.' });
      return false;
    }
    set({ busy: true, error: null });
    try {
      const user = await authApi.setObjetivoPrincipal(accessToken, objetivo);
      set({ user, busy: false });
      return true;
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Não foi possível salvar seu objetivo.', busy: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

export async function resetAuthStorage(): Promise<void> {
  await clearAuth();
}
