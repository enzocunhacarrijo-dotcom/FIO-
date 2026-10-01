const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MIN_PASSWORD = 8;

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return 'Informe seu e-mail.';
  if (!EMAIL_RE.test(v)) return 'Esse e-mail não parece válido.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Crie uma senha.';
  if (password.length < MIN_PASSWORD) return `A senha precisa ter ao menos ${MIN_PASSWORD} caracteres.`;
  return null;
}

export function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Repita a senha.';
  if (password !== confirm) return 'As senhas não coincidem.';
  return null;
}

/** Mensagem do backend para conta criada só com Google. */
export function isUseGoogleError(error: string | null): boolean {
  return !!error && /google/i.test(error);
}

export const GOOGLE_UNAVAILABLE = 'O login com Google não está disponível no momento. Use e-mail e senha ou tente mais tarde.';

/** Troca erros técnicos (rota ausente, Google sem configuração, rede) por texto amigável. */
export function friendlyAuthError(error: string | null): string | null {
  if (!error) return null;
  if (/^route .* not found/i.test(error) || /not configured|n[aã]o configurad|google_not_configured|not_configured/i.test(error)) {
    return GOOGLE_UNAVAILABLE;
  }
  if (/network request failed|failed to fetch|networkerror/i.test(error)) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  return error;
}
