import type { ObjetivoPrincipal, QuestionnaireResponse } from '@hair-analysis/shared';

export type QuestionOption = { value: string; label: string; exclusive?: boolean };

type BaseQuestion = {
  id: keyof QuestionnaireResponse;
  title: string;
  subtitle?: string;
  helpText?: string;
  showIf?: (answers: Partial<QuestionnaireResponse>) => boolean;
};

export type Question =
  | (BaseQuestion & { kind: 'single'; options: QuestionOption[] })
  | (BaseQuestion & { kind: 'multi'; options: QuestionOption[]; minSelected?: number })
  | (BaseQuestion & { kind: 'text'; placeholder: string });

export const QUESTIONS: Question[] = [
  {
    id: 'curvatura',
    kind: 'single',
    title: 'Como é a curvatura do seu cabelo?',
    subtitle: 'Escolha o que mais se aproxima, mesmo que varie ao longo do comprimento.',
    options: [
      { value: 'liso', label: 'Liso' },
      { value: 'ondulado', label: 'Ondulado' },
      { value: 'cacheado', label: 'Cacheado' },
      { value: 'crespo', label: 'Crespo' },
    ],
  },
  {
    id: 'comprimento',
    kind: 'single',
    title: 'Qual o comprimento atual?',
    options: [
      { value: 'curto', label: 'Curto, acima dos ombros' },
      { value: 'ombros', label: 'Na altura dos ombros' },
      { value: 'medio', label: 'Médio, abaixo dos ombros' },
      { value: 'longo', label: 'Longo' },
    ],
  },
  {
    id: 'frequenciaLavagem',
    kind: 'single',
    title: 'Com que frequência você lava o cabelo?',
    options: [
      { value: 'diaria', label: 'Todos os dias' },
      { value: 'dois_tres_dias', label: 'A cada 2 ou 3 dias' },
      { value: 'semanal', label: '1 vez por semana' },
      { value: 'menos_semanal', label: 'Menos de 1 vez por semana' },
    ],
  },
  {
    id: 'usoCalor',
    kind: 'multi',
    title: 'Quais ferramentas de calor você usa?',
    subtitle: 'Pode escolher mais de uma, ou nenhuma.',
    options: [
      { value: 'secador', label: 'Secador' },
      { value: 'chapinha', label: 'Chapinha' },
      { value: 'babyliss', label: 'Babyliss ou modelador' },
    ],
  },
  {
    id: 'frequenciaCalor',
    kind: 'single',
    title: 'Com que frequência usa essas ferramentas?',
    showIf: (a) => (a.usoCalor?.length ?? 0) > 0,
    options: [
      { value: 'diaria', label: 'Quase todo dia' },
      { value: 'algumas_vezes_semana', label: 'Algumas vezes por semana' },
      { value: 'raramente', label: 'Raramente' },
    ],
  },
  {
    id: 'historicoQuimica',
    kind: 'multi',
    title: 'Já fez algum desses procedimentos químicos?',
    subtitle: 'Pode escolher mais de um, ou nenhum.',
    helpText:
      'Progressiva/alisamento e relaxamento deixam o fio mais liso, alterando sua estrutura. Permanente (cacho químico) faz o oposto, criando cachos. Coloração e descoloração mudam só a cor, não o formato do fio.',
    options: [
      { value: 'coloracao', label: 'Coloração' },
      { value: 'descoloracao', label: 'Descoloração' },
      { value: 'progressiva', label: 'Progressiva ou alisamento' },
      { value: 'relaxamento', label: 'Relaxamento' },
      { value: 'permanente', label: 'Permanente (cacho químico)' },
    ],
  },
  {
    id: 'tempoUltimaQuimica',
    kind: 'single',
    title: 'Há quanto tempo foi a última vez?',
    showIf: (a) => (a.historicoQuimica?.length ?? 0) > 0,
    options: [
      { value: 'menos_1_mes', label: 'Menos de 1 mês' },
      { value: 'um_seis_meses', label: 'Entre 1 e 6 meses' },
      { value: 'seis_doze_meses', label: 'Entre 6 e 12 meses' },
      { value: 'mais_1_ano', label: 'Mais de 1 ano' },
    ],
  },
  {
    id: 'quedaPercebida',
    kind: 'single',
    title: 'Como está a queda de cabelo percebida?',
    subtitle: 'Descreva o que você tem notado, sem se preocupar em quantificar.',
    options: [
      { value: 'normal', label: 'Não percebo queda além do normal' },
      { value: 'um_pouco_mais', label: 'Um pouco mais do que o de costume' },
      { value: 'bem_mais', label: 'Bem mais do que o de costume' },
      { value: 'intensa_ou_localizada', label: 'Queda intensa ou concentrada em uma área' },
    ],
  },
  {
    id: 'coceira',
    kind: 'single',
    title: 'Sente coceira ou desconforto no couro cabeludo?',
    options: [
      { value: 'nunca', label: 'Nunca' },
      { value: 'as_vezes', label: 'Às vezes' },
      { value: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'descamacao',
    kind: 'single',
    title: 'Percebe descamação no couro cabeludo?',
    options: [
      { value: 'nao', label: 'Não' },
      { value: 'pouca', label: 'Um pouco' },
      { value: 'bastante', label: 'Bastante' },
    ],
  },
  {
    id: 'oleosidadeCouro',
    kind: 'single',
    title: 'Como descreveria o couro cabeludo?',
    options: [
      { value: 'seco', label: 'Seco' },
      { value: 'equilibrado', label: 'Equilibrado' },
      { value: 'oleoso', label: 'Oleoso' },
    ],
  },
  {
    id: 'exposicaoAgua',
    kind: 'multi',
    title: 'Que tipo de água costuma pegar no seu cabelo?',
    subtitle: 'Pode escolher mais de uma.',
    helpText:
      'Água "dura" tem mais minerais (calcário) e pode ressecar o fio aos poucos — é comum em regiões com poço ou caixa d’água sem filtro. Se você não souber, sem problema: escolha "Não sei dizer".',
    options: [
      { value: 'tratada', label: 'Água tratada, da torneira' },
      { value: 'dura', label: 'Água dura, com calcário' },
      { value: 'piscina', label: 'Piscina com frequência' },
      { value: 'mar', label: 'Mar com frequência' },
      { value: 'nao_sei', label: 'Não sei dizer' },
    ],
  },
  {
    id: 'produtosAtuais',
    kind: 'text',
    title: 'Quais produtos você usa atualmente?',
    subtitle: 'Shampoo, condicionador, máscara, leave-in — o que vier à mente.',
    placeholder: 'Ex: shampoo hidratante, óleo de argan nas pontas...',
  },
  {
    id: 'objetivos',
    kind: 'multi',
    title: 'O que você quer melhorar?',
    subtitle: 'Escolha ao menos uma opção.',
    minSelected: 1,
    options: [
      { value: 'reduzir_frizz', label: 'Reduzir frizz' },
      { value: 'mais_volume', label: 'Mais volume' },
      { value: 'menos_quebra', label: 'Menos quebra' },
      { value: 'definir_cacho', label: 'Definir cacho' },
      { value: 'controlar_oleosidade', label: 'Controlar oleosidade' },
      { value: 'reduzir_queda', label: 'Reduzir queda' },
      { value: 'hidratar', label: 'Hidratar' },
    ],
  },
  {
    id: 'restricoes',
    kind: 'multi',
    title: 'Alguma restrição ou preferência?',
    subtitle: 'Pode escolher mais de uma.',
    helpText: '"Low poo" é lavar com produtos suaves, sem os sulfatos fortes dos shampoos comuns — não é a mesma coisa que "sem sulfato" (que exclui todo tipo de sulfato).',
    options: [
      { value: 'vegano', label: 'Vegano' },
      { value: 'sem_sulfato', label: 'Sem sulfato' },
      { value: 'sem_silicone', label: 'Sem silicone' },
      { value: 'low_poo', label: 'Low poo' },
      { value: 'orcamento', label: 'Orçamento limitado' },
      { value: 'nenhuma', label: 'Nenhuma restrição', exclusive: true },
    ],
  },
  {
    id: 'genero',
    kind: 'single',
    title: 'Uma última pergunta, opcional',
    subtitle: 'Perguntamos só porque padrões de queda variam por gênero — isso nunca muda o conteúdo ou o visual do app.',
    options: [
      { value: 'feminino', label: 'Feminino' },
      { value: 'masculino', label: 'Masculino' },
      { value: 'nao_binario', label: 'Não-binário' },
      { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
    ],
  },
];

// Perguntas comuns a qualquer objetivo vêm primeiro; o resto é reordenado (não
// removido — ninguém deixa de responder nada) pra priorizar o que é mais
// relevante pro objetivo escolhido, sem segmentar por gênero.
const ALWAYS_FIRST_IDS: (keyof QuestionnaireResponse)[] = ['curvatura', 'comprimento', 'frequenciaLavagem'];
const FIO_TRACK_IDS: (keyof QuestionnaireResponse)[] = ['usoCalor', 'frequenciaCalor', 'historicoQuimica', 'tempoUltimaQuimica'];
const DENSIDADE_TRACK_IDS: (keyof QuestionnaireResponse)[] = ['quedaPercebida', 'coceira', 'descamacao', 'oleosidadeCouro'];

export function getOrderedQuestions(objetivo: ObjetivoPrincipal | null): Question[] {
  const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
  const pick = (ids: (keyof QuestionnaireResponse)[]) => ids.map((id) => byId.get(id)).filter((q): q is Question => !!q);

  const always = pick(ALWAYS_FIRST_IDS);
  const fio = pick(FIO_TRACK_IDS);
  const densidade = pick(DENSIDADE_TRACK_IDS);
  const trackedIds = new Set([...ALWAYS_FIRST_IDS, ...FIO_TRACK_IDS, ...DENSIDADE_TRACK_IDS]);
  const tail = QUESTIONS.filter((q) => !trackedIds.has(q.id));

  if (objetivo === 'qualidade_do_fio') return [...always, ...fio, ...densidade, ...tail];
  if (objetivo === 'densidade_e_queda') return [...always, ...densidade, ...fio, ...tail];
  return [...always, ...fio, ...densidade, ...tail];
}

export function toggleMultiValue(current: string[], options: QuestionOption[], value: string): string[] {
  const option = options.find((o) => o.value === value);
  if (!option) return current;

  if (option.exclusive) {
    return current.includes(value) ? [] : [value];
  }

  const exclusiveValues = new Set(options.filter((o) => o.exclusive).map((o) => o.value));
  const withoutExclusives = current.filter((v) => !exclusiveValues.has(v));
  return withoutExclusives.includes(value)
    ? withoutExclusives.filter((v) => v !== value)
    : [...withoutExclusives, value];
}
