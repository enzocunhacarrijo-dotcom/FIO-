import * as Notifications from 'expo-notifications';
import { getItem, setItem } from './secure-storage';

const KEY_ENABLED = 'reminder_enabled';
const KEY_INTERVAL_DAYS = 'reminder_interval_days';
export const DEFAULT_REMINDER_INTERVAL_DAYS = 30;
export const REMINDER_INTERVAL_OPTIONS = [15, 30, 60] as const;

export type ReminderPreference = { enabled: boolean; intervalDays: number };

export async function getReminderPreference(): Promise<ReminderPreference> {
  const [enabled, intervalDays] = await Promise.all([getItem(KEY_ENABLED), getItem(KEY_INTERVAL_DAYS)]);
  return {
    enabled: enabled === 'true',
    intervalDays: intervalDays ? Number(intervalDays) : DEFAULT_REMINDER_INTERVAL_DAYS,
  };
}

/**
 * Cancels any previously scheduled reminder and, if enabled, schedules a new
 * one relative to the last analysis date (or now, if there is none yet).
 * Local notification only — no push token, no server round-trip. Actual
 * delivery can only be verified on a real device, not in this dev setup.
 */
export async function setReminderPreference(
  pref: ReminderPreference,
  lastAnalysisDate: Date | null,
): Promise<{ ok: boolean; error?: string }> {
  await setItem(KEY_ENABLED, String(pref.enabled));
  await setItem(KEY_INTERVAL_DAYS, String(pref.intervalDays));

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!pref.enabled) return { ok: true };

    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      return { ok: false, error: 'Sem permissão para notificações. Ative nas configurações do iPhone.' };
    }

    const base = lastAnalysisDate ?? new Date();
    const next = new Date(base.getTime() + pref.intervalDays * 24 * 60 * 60 * 1000);
    if (next.getTime() <= Date.now()) {
      next.setTime(Date.now() + 60 * 1000);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de uma nova análise',
        body: 'O cabelo cresce devagar, mas dá pra acompanhar a evolução. Tire novas fotos quando puder.',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: next },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Não foi possível ativar lembretes neste dispositivo.' };
  }
}
