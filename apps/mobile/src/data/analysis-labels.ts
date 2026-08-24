export const LABELS: Record<string, string> = {
  // curvatura
  liso: 'Liso',
  ondulado: 'Ondulado',
  cacheado: 'Cacheado',
  crespo: 'Crespo',
  // baixa/media/alta scales (densidade, porosidade, quebra)
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  // baixo/medio/alto scales (frizz, brilho)
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
  // nao/pouca/bastante scales (descamação, vermelhidão)
  nao: 'Não',
  pouca: 'Pouca',
  bastante: 'Bastante',
  // oleosidade
  seco: 'Seco',
  equilibrado: 'Equilibrado',
  oleoso: 'Oleoso',
  // pontas duplas
  poucas: 'Poucas',
  moderadas: 'Moderadas',
  muitas: 'Muitas',
  // fonte
  foto: 'Foto',
  questionario: 'Questionário',
  ambos: 'Foto + questionário',
  // confiança
  alta_confianca: 'Confiança alta',
  media_confianca: 'Confiança média',
  baixa_confianca: 'Confiança baixa',
};

export function label(value: string): string {
  return LABELS[value] ?? value;
}

export function confiancaLabel(value: 'alta' | 'media' | 'baixa'): string {
  return LABELS[`${value}_confianca`] ?? value;
}
