import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store has no web backend (native-only module) — fall back to
// localStorage there so the app doesn't hang when running on web.
const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // best-effort on web
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // best-effort on web
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
