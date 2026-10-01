// Helpers puros do fluxo "Entrar com Google" (OAuth mediado pelo backend).
// O backend devolve o app por deep link com `?code=...` (troca única por JWT)
// ou `?error=<motivo>`.

export type GoogleCallbackResult =
  | { kind: 'code'; code: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  google_failed: 'Não foi possível entrar com o Google.',
  email_unverified: 'Seu e-mail Google não está verificado.',
};

export const GOOGLE_GENERIC_ERROR = 'Não foi possível entrar com o Google.';

/** Interpreta a URL de retorno do navegador (deep link do app). */
export function parseGoogleCallback(url: string): GoogleCallbackResult {
  const queryStart = url.indexOf('?');
  const params = new URLSearchParams(queryStart === -1 ? '' : url.slice(queryStart + 1).split('#')[0]);

  const error = params.get('error');
  if (error === 'cancelled') return { kind: 'cancelled' };
  if (error) return { kind: 'error', message: ERROR_MESSAGES[error] ?? GOOGLE_GENERIC_ERROR };

  const code = params.get('code');
  if (code && /^[0-9a-f]{64}$/.test(code)) return { kind: 'code', code };
  return { kind: 'error', message: GOOGLE_GENERIC_ERROR };
}
