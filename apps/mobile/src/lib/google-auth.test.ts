import { describe, expect, it } from 'vitest';
import { parseGoogleCallback } from './google-auth';

const CODE = 'a'.repeat(64);

describe('parseGoogleCallback', () => {
  it('extrai o code do deep link', () => {
    expect(parseGoogleCallback(`fio://auth/google?code=${CODE}`)).toEqual({ kind: 'code', code: CODE });
    expect(parseGoogleCallback(`exp://192.168.0.2:8081/--/auth/google?code=${CODE}`)).toEqual({
      kind: 'code',
      code: CODE,
    });
  });

  it('cancelamento não vira erro', () => {
    expect(parseGoogleCallback('fio://auth/google?error=cancelled')).toEqual({ kind: 'cancelled' });
  });

  it('mapeia erros conhecidos e usa mensagem genérica nos demais', () => {
    expect(parseGoogleCallback('fio://auth/google?error=email_unverified')).toEqual({
      kind: 'error',
      message: 'Seu e-mail Google não está verificado.',
    });
    expect(parseGoogleCallback('fio://auth/google?error=google_failed')).toMatchObject({ kind: 'error' });
    expect(parseGoogleCallback('fio://auth/google?error=whatever')).toMatchObject({
      kind: 'error',
      message: 'Não foi possível entrar com o Google.',
    });
  });

  it('rejeita retorno sem code válido', () => {
    expect(parseGoogleCallback('fio://auth/google')).toMatchObject({ kind: 'error' });
    expect(parseGoogleCallback('fio://auth/google?code=curto')).toMatchObject({ kind: 'error' });
  });
});
