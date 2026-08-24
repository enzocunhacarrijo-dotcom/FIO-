import type { DiaDaSemana } from '@hair-analysis/shared';

const WEEKDAY_BY_JS_DAY: DiaDaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export function todayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayWeekday(): DiaDaSemana {
  return WEEKDAY_BY_JS_DAY[new Date().getDay()]!;
}

export const WEEKDAY_LABEL: Record<DiaDaSemana, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo',
};
