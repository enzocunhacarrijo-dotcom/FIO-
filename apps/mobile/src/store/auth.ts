import { create } from 'zustand';
import type { AuthResponse, CurrentUser } from '@hair-analysis/shared';
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

// Several screens fire authenticated requests in parallel (Promise.all).
// If each one independently hits an expired access token, they must share
// a single refresh call — otherwise they race the backend's refresh-token
// rotation and the loser wipes out the winner's just-restored session.
let inFlightRefresh: Promise<boolean> | null = null;

type AuthState = {
  status: 'loading' | 'ready';
  user: CurrentUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  busy: boolean;
  lgpdConsented: boolean;
  setLgpdConsented: (value: boolean) => void;
  hydrate: () => Promise<void>;
  registerAccount: (email: string, password: string) => Promise<boolean>;
  loginAccount: (email: string, password: string) => Promise<boolean>;
  continueAsGuest: () => Promise<boolean>;
  setPremium: (isPremium: boolean) => Promise<boolean>;
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  refreshToken: null,
  error: null,
  busy: false,
  lgpdConsented: false,

  setLgpdConsented: (value) => set({ lgpdConsented: value }),

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
      const auth = await authApi.register(email, password, get().lgpdConsented);
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
      const auth = await authApi.loginAsGuest(deviceId, get().lgpdConsented);
      await persistAuth(auth);
      set({ user: auth.user, accessToken: auth.accessToken, refreshToken: auth.refreshToken, busy: false });
      return true;
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Não foi possível continuar sem conta.', busy: false });
      return false;
    }
  },

  setPremium: async (isPremium) => {
    const { accessToken } = get();
    if (!accessToken) return false;
    try {
      const user = await authApi.setPremium(accessToken, isPremium);
      set({ user });
      return true;
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : 'Não foi possível atualizar seu plano.' });
      return false;
    }
  },

  logout: async () => {
    await clearAuth();
    set({ user: null, accessToken: null, refreshToken: null, lgpdConsented: false });
  },

  refresh: async () => {
    if (inFlightRefresh) return inFlightRefresh;
    inFlightRefresh = (async () => {
      const { refreshToken } = get();
      if (!refreshToken) {
        await clearAuth();
        set({ user: null, accessToken: null, refreshToken: null });
        return false;
      }
      try {
        const auth = await authApi.refresh(refreshToken);
        await persistAuth(auth);
        set({ user: auth.user, accessToken: auth.accessToken, refreshToken: auth.refreshToken });
        return true;
      } catch {
        await clearAuth();
        set({ user: null, accessToken: null, refreshToken: null });
        return false;
      } finally {
        inFlightRefresh = null;
      }
    })();
    return inFlightRefresh;
  },

  clearError: () => set({ error: null }),
}));
