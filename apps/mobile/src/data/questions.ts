import type { QuestionnaireResponse } from '@hair-analysis/shared';

export type QuestionOption = { value: string; label: string; exclusive?: boolean };
export type OptionsSource =
  | QuestionOption[]
  | ((answers: Partial<QuestionnaireResponse>) => QuestionOption[]);

type BaseQuestion = {
  id: keyof QuestionnaireResponse;
  title: string;
  subtitle?: string;
  helpText?: string;
  showIf?: (answers: Partial<QuestionnaireResponse>) => boolean;
};

export type Question =
  | (BaseQuestion & { kind: 'single'; options: OptionsSource })
  | (BaseQuestion & { kind: 'multi'; options: OptionsSource; minSelected?: number })
  | (BaseQuestion & { kind: 'text'; placeholder: string });

export function resolveOptions(question: Question, answers: Partial<QuestionnaireResponse>): QuestionOption[] {
  if (question.kind === 'text') return [];
  return typeof question.options === 'function' ? question.options(answers) : question.options;
}

// ---------------------------------------------------------------------------
// Predicados usados em `showIf`. Cada um existe porque uma resposta anterior
// torna a próxima pergunta relevante (ou irrelevante) — nunca por segmentação
// arbitrária. Ver a especificação de onboarding para a justificativa de cada
// bloco.
// ---------------------------------------------------------------------------

const hasAny = (arr: string[] | undefined, ...values: string[]) => (arr ?? []).some((v) => values.includes(v));

const QUEDA_RELATADA = ['sim_leve', 'sim_bastante'];
const quedaRelatada = (a: Partial<QuestionnaireResponse>) => QUEDA_RELATADA.includes(a.quedaPercebida ?? '');
const quedaRelevante = (a: Partial<QuestionnaireResponse>) =>
  a.quedaPercebida === 'sim_bastante' || a.tipoQueda === 'fios_inteiros';

const temSintomaComDuracaoRelevante = (a: Partial<QuestionnaireResponse>) =>
  hasAny(a.sintomasCouroCabeludo, 'caspa_descamacao', 'coceira', 'vermelhidao');

const fezQuimica = (a: Partial<QuestionnaireResponse>) =>
  (a.historicoQuimica ?? []).some((v) => v !== 'nenhum');

const usaCalor = (a: Partial<QuestionnaireResponse>) => a.frequenciaUsoCalor !== undefined && a.frequenciaUsoCalor !== 'nunca';
const usaCalorRegularmente = (a: Partial<QuestionnaireResponse>) =>
  a.frequenciaUsoCalor === 'uma_duas_vezes_semana' ||
  a.frequenciaUsoCalor === 'tres_cinco_vezes_semana' ||
  a.frequenciaUsoCalor === 'quase_todos_os_dias';

const tracaoRelevante = (a: Partial<QuestionnaireResponse>) =>
  ['medio', 'longo', 'muito_longo'].includes(a.comprimento ?? '') ||
  ['cacheado', 'muito_cacheado', 'crespo'].includes(a.curvatura ?? '') ||
  quedaRelatada(a);

// ---------------------------------------------------------------------------
// Opções compartilhadas entre perguntas (ex: a pergunta de prioridade só
// mostra as metas que a pessoa escolheu na pergunta anterior).
// ---------------------------------------------------------------------------

const OBJETIVO_OPTIONS: QuestionOption[] = [
  { value: 'reduzir_queda', label: 'Reduzir queda' },
  { value: 'reduzir_quebra', label: 'Reduzir quebra' },
  { value: 'deixar_crescer', label: 'Deixar crescer' },
  { value: 'aumentar_volume', label: 'Aumentar aparência de volume' },
  { value: 'controlar_oleosidade', label: 'Controlar oleosidade' },
  { value: 'reduzir_ressecamento', label: 'Reduzir ressecamento' },
  { value: 'reduzir_frizz', label: 'Reduzir frizz' },
  { value: 'melhorar_definicao_cachos', label: 'Melhorar definição dos cachos/ondas' },
  { value: 'recuperar_danificado', label: 'Recuperar cabelo danificado' },
  { value: 'melhorar_brilho_maciez', label: 'Melhorar brilho/maciez' },
  { value: 'cuidar_couro_cabeludo', label: 'Cuidar do couro cabeludo' },
  { value: 'manter_saudavel', label: 'Manter o cabelo saudável' },
  { value: 'outro', label: 'Outro' },
];

export const QUESTIONS: Question[] = [
  // ===== BLOCO A — Perfil básico =====
  {
    id: 'sexo',
    kind: 'single',
    title: 'Qual é o seu sexo?',
    subtitle: 'Usamos isso só para calibrar perguntas sobre padrões de queda — nunca para presumir sua rotina de cuidado.',
    options: [
      { value: 'masculino', label: 'Masculino' },
      { value: 'feminino', label: 'Feminino' },
      { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
    ],
  },
  {
    id: 'faixaEtaria',
    kind: 'single',
    title: 'Qual é a sua faixa etária?',
    subtitle: 'Ajuda a contextualizar características e padrões relacionados à idade.',
    options: [
      { value: 'ate_17', label: 'Até 17 anos' },
      { value: '18_24', label: '18 a 24 anos' },
      { value: '25_34', label: '25 a 34 anos' },
      { value: '35_44', label: '35 a 44 anos' },
      { value: '45_54', label: '45 a 54 anos' },
      { value: '55_64', label: '55 a 64 anos' },
      { value: '65_mais', label: '65 anos ou mais' },
    ],
  },
  {
    id: 'objetivos',
    kind: 'multi',
    title: 'O que você quer alcançar com seu cabelo?',
    subtitle: 'Escolha quantos fizerem sentido.',
    minSelected: 1,
    options: OBJETIVO_OPTIONS,
  },
  {
    id: 'objetivoPrioridade',
    kind: 'single',
    title: 'Qual desses é o mais importante pra você agora?',
    subtitle: 'Vamos priorizar as recomendações por aqui.',
    showIf: (a) => (a.objetivos?.length ?? 0) > 1,
    options: (a) => OBJETIVO_OPTIONS.filter((o) => ((a.objetivos as string[] | undefined) ?? []).includes(o.value)),
  },

  // ===== BLOCO B — Características do cabelo =====
  {
    id: 'curvatura',
    kind: 'single',
    title: 'Como você descreveria o formato natural do seu cabelo?',
    subtitle: 'A foto complementa essa informação — escolha o que mais se aproxima.',
    options: [
      { value: 'liso', label: 'Liso' },
      { value: 'levemente_ondulado', label: 'Levemente ondulado' },
      { value: 'ondulado', label: 'Ondulado' },
      { value: 'cacheado', label: 'Cacheado' },
      { value: 'muito_cacheado', label: 'Muito cacheado' },
      { value: 'crespo', label: 'Crespo' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },
  {
    id: 'espessuraFio',
    kind: 'single',
    title: 'Você considera que seus fios são:',
    helpText: 'Role um fio entre os dedos: se quase não sente, é fino; se é claramente perceptível e firme, é grosso.',
    options: [
      { value: 'muito_fino', label: 'Muito finos' },
      { value: 'fino', label: 'Finos' },
      { value: 'medio', label: 'Médios' },
      { value: 'grosso', label: 'Grossos' },
      { value: 'muito_grosso', label: 'Muito grossos' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },
  {
    id: 'comprimento',
    kind: 'single',
    title: 'Qual é o comprimento aproximado do seu cabelo?',
    options: [
      { value: 'raspado_muito_curto', label: 'Raspado ou muito curto' },
      { value: 'curto', label: 'Curto' },
      { value: 'medio', label: 'Médio' },
      { value: 'longo', label: 'Longo' },
      { value: 'muito_longo', label: 'Muito longo' },
    ],
  },

  // ===== BLOCO C — Couro cabeludo e queda =====
  {
    id: 'tempoOleosidadeRaiz',
    kind: 'single',
    title: 'Depois de lavar o cabelo, quanto tempo leva até a raiz ficar visivelmente oleosa?',
    options: [
      { value: 'menos_24h', label: 'Menos de 24 horas' },
      { value: 'um_dois_dias', label: '1 a 2 dias' },
      { value: 'tres_quatro_dias', label: '3 a 4 dias' },
      { value: 'mais_4_dias', label: 'Mais de 4 dias' },
      { value: 'nunca_percebi', label: 'Nunca percebi' },
    ],
  },
  {
    id: 'sintomasCouroCabeludo',
    kind: 'multi',
    title: 'Você costuma apresentar algum desses sintomas no couro cabeludo?',
    subtitle: 'Pode escolher mais de um.',
    minSelected: 1,
    options: [
      { value: 'nenhum', label: 'Nenhum', exclusive: true },
      { value: 'caspa_descamacao', label: 'Caspa ou descamação' },
      { value: 'coceira', label: 'Coceira' },
      { value: 'vermelhidao', label: 'Vermelhidão' },
      { value: 'sensibilidade_ardencia', label: 'Sensibilidade ou ardência' },
      { value: 'feridas', label: 'Feridas' },
      { value: 'espinhas_pustulas', label: 'Espinhas ou pústulas' },
      { value: 'dor', label: 'Dor' },
      { value: 'outro', label: 'Outro' },
    ],
  },
  {
    id: 'duracaoSintomasCouroCabeludo',
    kind: 'single',
    title: 'Há quanto tempo você percebe isso?',
    subtitle: 'Sintomas persistentes por muitas semanas costumam merecer uma avaliação à parte.',
    showIf: temSintomaComDuracaoRelevante,
    options: [
      { value: 'menos_4_semanas', label: 'Menos de 4 semanas' },
      { value: 'mais_4_semanas', label: 'Mais de 4 semanas, sem melhora' },
      { value: 'recorrente', label: 'Vai e volta com frequência' },
    ],
  },
  {
    id: 'quedaPercebida',
    kind: 'single',
    title: 'Você percebe queda de cabelo acima do que considera normal?',
    options: [
      { value: 'nao', label: 'Não' },
      { value: 'sim_leve', label: 'Sim, levemente' },
      { value: 'sim_bastante', label: 'Sim, bastante' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },
  {
    id: 'tipoQueda',
    kind: 'single',
    title: 'Você percebe principalmente fios inteiros caindo ou fios quebrando no meio?',
    subtitle: 'São coisas diferentes: queda é o fio saindo da raiz; quebra é o fio partindo no meio.',
    showIf: quedaRelatada,
    options: [
      { value: 'fios_inteiros', label: 'Fios inteiros caindo' },
      { value: 'quebra_no_meio', label: 'Fios quebrando no meio' },
      { value: 'ambos', label: 'Os dois' },
      { value: 'nao_sei', label: 'Não sei dizer' },
    ],
  },
  {
    id: 'inicioQueda',
    kind: 'single',
    title: 'Há quanto tempo essa queda começou?',
    showIf: quedaRelevante,
    options: [
      { value: 'menos_1_mes', label: 'Menos de 1 mês' },
      { value: 'um_tres_meses', label: 'Entre 1 e 3 meses' },
      { value: 'tres_seis_meses', label: 'Entre 3 e 6 meses' },
      { value: 'mais_6_meses', label: 'Mais de 6 meses' },
    ],
  },
  {
    id: 'padraoQueda',
    kind: 'single',
    title: 'Essa queda é mais difusa (espalhada) ou concentrada em uma área?',
    showIf: quedaRelevante,
    options: [
      { value: 'difusa', label: 'Espalhada por toda a cabeça' },
      { value: 'concentrada_uma_area', label: 'Concentrada em uma área' },
      { value: 'entradas_ou_topo', label: 'Mais nas entradas ou no topo' },
      { value: 'nao_sei', label: 'Não sei dizer' },
    ],
  },
  {
    id: 'areasFalhadas',
    kind: 'single',
    title: 'Você nota alguma área sem cabelo, bem delimitada?',
    showIf: quedaRelevante,
    options: [
      { value: 'sim', label: 'Sim' },
      { value: 'nao', label: 'Não' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },
  {
    id: 'eventosRecentesRelevantes',
    kind: 'multi',
    title: 'Essa queda começou perto de algum desses eventos?',
    subtitle: 'Pode escolher mais de um, ou nenhum — é opcional e fica só entre você e a análise.',
    showIf: quedaRelevante,
    options: (a) => {
      const base: QuestionOption[] = [
        { value: 'doenca_febril', label: 'Doença febril' },
        { value: 'cirurgia', label: 'Cirurgia' },
      ];
      if (a.sexo === 'feminino') base.push({ value: 'parto_pos_parto', label: 'Gravidez recente ou pós-parto' });
      base.push(
        { value: 'perda_peso_importante', label: 'Perda de peso importante' },
        { value: 'dieta_restritiva_severa', label: 'Dieta muito restritiva' },
        { value: 'estresse_intenso', label: 'Período de estresse intenso' },
        { value: 'mudanca_medicamentos', label: 'Mudança de medicamentos' },
        { value: 'nenhum_evento', label: 'Nenhum desses' },
      );
      return base;
    },
  },

  // ===== BLOCO D — Histórico químico =====
  {
    id: 'historicoQuimica',
    kind: 'multi',
    title: 'Você fez algum procedimento químico no cabelo nos últimos 24 meses?',
    subtitle: 'Pode escolher mais de um.',
    minSelected: 1,
    helpText:
      'Relaxamento e progressiva deixam o fio mais liso, alterando sua estrutura — o relaxamento é permanente; a progressiva, semipermanente. Permanente faz o oposto, criando cachos. Coloração, mechas e descoloração mudam a cor.',
    options: [
      { value: 'nenhum', label: 'Nenhum', exclusive: true },
      { value: 'coloracao', label: 'Coloração' },
      { value: 'descoloracao_luzes_mechas', label: 'Descoloração, luzes ou mechas' },
      { value: 'relaxamento', label: 'Relaxamento' },
      { value: 'permanente', label: 'Permanente (cacho químico)' },
      { value: 'progressiva', label: 'Progressiva' },
      { value: 'outro', label: 'Outro' },
    ],
  },
  {
    id: 'frequenciaQuimica',
    kind: 'single',
    title: 'Com que frequência você faz esse procedimento?',
    showIf: fezQuimica,
    options: [
      { value: 'a_cada_1_2_meses', label: 'A cada 1 ou 2 meses' },
      { value: 'a_cada_3_4_meses', label: 'A cada 3 ou 4 meses' },
      { value: 'a_cada_5_6_meses', label: 'A cada 5 ou 6 meses' },
      { value: 'raramente', label: 'Raramente' },
    ],
  },
  {
    id: 'tempoUltimaQuimica',
    kind: 'single',
    title: 'Quando foi a última vez?',
    showIf: fezQuimica,
    options: [
      { value: 'menos_1_mes', label: 'Menos de 1 mês' },
      { value: 'um_seis_meses', label: 'Entre 1 e 6 meses' },
      { value: 'seis_doze_meses', label: 'Entre 6 e 12 meses' },
      { value: 'mais_1_ano', label: 'Mais de 1 ano' },
    ],
  },

  // ===== BLOCO E — Calor e manipulação =====
  {
    id: 'frequenciaUsoCalor',
    kind: 'single',
    title: 'Com que frequência você usa ferramentas de calor no cabelo?',
    options: [
      { value: 'nunca', label: 'Nunca' },
      { value: 'raramente', label: 'Raramente' },
      { value: 'uma_duas_vezes_semana', label: '1 a 2 vezes por semana' },
      { value: 'tres_cinco_vezes_semana', label: '3 a 5 vezes por semana' },
      { value: 'quase_todos_os_dias', label: 'Praticamente todos os dias' },
    ],
  },
  {
    id: 'ferramentasCalor',
    kind: 'multi',
    title: 'Quais ferramentas você usa?',
    subtitle: 'Pode escolher mais de uma.',
    showIf: usaCalor,
    options: [
      { value: 'secador', label: 'Secador' },
      { value: 'chapinha', label: 'Chapinha/prancha' },
      { value: 'babyliss_modelador', label: 'Babyliss ou modelador' },
      { value: 'escova_secadora', label: 'Escova secadora' },
      { value: 'outro', label: 'Outro' },
    ],
  },
  {
    id: 'protetorTermico',
    kind: 'single',
    title: 'Você costuma usar protetor térmico?',
    showIf: usaCalor,
    options: [
      { value: 'sempre', label: 'Sempre' },
      { value: 'as_vezes', label: 'Às vezes' },
      { value: 'nunca', label: 'Nunca' },
      { value: 'nao_sei_o_que_e', label: 'Não sei o que é' },
    ],
  },
  {
    id: 'temperaturaCalorPercebida',
    kind: 'single',
    title: 'Quando usa essas ferramentas, a temperatura costuma ser:',
    subtitle: 'Só responda se souber — não precisa saber o grau exato.',
    showIf: usaCalorRegularmente,
    options: [
      { value: 'baixa', label: 'Baixa' },
      { value: 'media', label: 'Média' },
      { value: 'alta', label: 'Alta' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },

  // ===== BLOCO F — Rotina de lavagem =====
  {
    id: 'frequenciaLavagem',
    kind: 'single',
    title: 'Quantas vezes por semana você lava o cabelo?',
    options: [
      { value: 'todos_os_dias', label: 'Todos os dias' },
      { value: 'cinco_seis_por_semana', label: '5 a 6 vezes' },
      { value: 'tres_quatro_por_semana', label: '3 a 4 vezes' },
      { value: 'uma_duas_por_semana', label: '1 a 2 vezes' },
      { value: 'menos_de_uma_por_semana', label: 'Menos de 1 vez por semana' },
    ],
  },
  {
    id: 'produtosLavagem',
    kind: 'multi',
    title: 'O que você normalmente usa durante a lavagem?',
    subtitle: 'Pode escolher mais de um.',
    minSelected: 1,
    options: [
      { value: 'xampu', label: 'Xampu' },
      { value: 'xampu_anticaspa', label: 'Xampu anticaspa' },
      { value: 'co_wash', label: 'Co-wash (lavar só com condicionador)' },
      { value: 'condicionador', label: 'Condicionador' },
      { value: 'mascara', label: 'Máscara' },
      { value: 'outros', label: 'Outros' },
    ],
  },
  {
    id: 'limpezaProfundaOcasional',
    kind: 'single',
    title: 'De vez em quando você usa um xampu para limpar mais a fundo?',
    subtitle: 'Co-wash sozinho, sem uma limpeza mais profunda de vez em quando, pode acumular resíduo.',
    showIf: (a) => hasAny(a.produtosLavagem, 'co_wash') && !hasAny(a.produtosLavagem, 'xampu', 'xampu_anticaspa'),
    options: [
      { value: 'sim', label: 'Sim, de vez em quando' },
      { value: 'nao', label: 'Não, uso só co-wash' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },

  // ===== BLOCO G — Produtos, restrições e ambiente =====
  {
    id: 'produtosAtuaisTipos',
    kind: 'multi',
    title: 'Além do que já usa na lavagem, o que mais usa no cabelo?',
    subtitle: 'Leave-in, óleo, finalizadores... pode escolher mais de um.',
    minSelected: 1,
    options: [
      { value: 'nenhum', label: 'Nenhum outro produto', exclusive: true },
      { value: 'leave_in', label: 'Leave-in' },
      { value: 'creme_pentear', label: 'Creme para pentear' },
      { value: 'oleo', label: 'Óleo' },
      { value: 'serum', label: 'Sérum' },
      { value: 'gel', label: 'Gel' },
      { value: 'pomada', label: 'Pomada' },
      { value: 'cera', label: 'Cera' },
      { value: 'spray', label: 'Spray' },
      { value: 'protetor_termico', label: 'Protetor térmico' },
      { value: 'produto_anticaspa', label: 'Produto anticaspa' },
      { value: 'produto_antiqueda', label: 'Produto antiqueda' },
      { value: 'outro', label: 'Outro' },
    ],
  },
  {
    id: 'restricoes',
    kind: 'multi',
    title: 'Alguma restrição ou preferência?',
    subtitle: 'Pode escolher mais de uma.',
    minSelected: 1,
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
    id: 'exposicaoAmbiental',
    kind: 'multi',
    title: 'Alguma dessas situações faz parte da sua rotina com regularidade?',
    subtitle: 'Pode escolher mais de uma.',
    minSelected: 1,
    options: [
      { value: 'piscina', label: 'Frequento piscina' },
      { value: 'mar', label: 'Entro no mar com frequência' },
      { value: 'sauna', label: 'Frequento sauna' },
      { value: 'treino_com_suor', label: 'Treino e transpiro bastante no couro cabeludo' },
      { value: 'sol_prolongado', label: 'Fico exposto ao sol por períodos longos' },
      { value: 'nenhuma', label: 'Nenhuma dessas', exclusive: true },
    ],
  },

  // ===== BLOCO H — Manipulação, penteados e tração (só quando relevante) =====
  {
    id: 'prendeCabeloFrequencia',
    kind: 'single',
    title: 'Você costuma prender o cabelo por longos períodos?',
    showIf: tracaoRelevante,
    options: [
      { value: 'nao', label: 'Não' },
      { value: 'as_vezes', label: 'Às vezes' },
      { value: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'penteadosApertados',
    kind: 'multi',
    title: 'Costuma usar penteados apertados?',
    subtitle: 'Tranças, extensões, apliques, rabo de cavalo ou coque apertados.',
    showIf: (a) => tracaoRelevante(a) && (a.prendeCabeloFrequencia === 'as_vezes' || a.prendeCabeloFrequencia === 'frequentemente'),
    options: [
      { value: 'trancas', label: 'Tranças' },
      { value: 'extensoes_apliques', label: 'Extensões ou apliques' },
      { value: 'rabo_coque_apertado', label: 'Rabo de cavalo ou coque apertado' },
      { value: 'nenhum', label: 'Nenhum desses', exclusive: true },
    ],
  },
  {
    id: 'dificuldadeDesembaraco',
    kind: 'single',
    title: 'Você sente dificuldade ou precisa fazer força para desembaraçar o cabelo?',
    showIf: tracaoRelevante,
    options: [
      { value: 'nenhuma', label: 'Nenhuma dificuldade' },
      { value: 'um_pouco', label: 'Um pouco' },
      { value: 'muita', label: 'Muita força' },
    ],
  },

  // ===== BLOCO I — Comportamento funcional do cabelo =====
  {
    id: 'respostaProdutoHidratante',
    kind: 'single',
    title: 'Quando você aplica produtos hidratantes, óleos ou cremes, o que costuma acontecer?',
    options: [
      { value: 'absorve_rapido_continua_seco', label: 'O cabelo absorve rápido e continua áspero/seco' },
      { value: 'fica_macio_equilibrado', label: 'Fica macio e equilibrado' },
      { value: 'produto_fica_por_cima', label: 'O produto parece ficar por cima, sem absorver' },
      { value: 'fica_pesado_oleoso_facil', label: 'Fica pesado ou oleoso com facilidade' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },
  {
    id: 'comportamentoMolhado',
    kind: 'single',
    title: 'Quando o cabelo está molhado, como ele costuma se comportar?',
    options: [
      { value: 'fragil_quebra_facil', label: 'Fica muito frágil e quebra com facilidade' },
      { value: 'elastico_maleavel_normal', label: 'Fica elástico e maleável, normal' },
      { value: 'muito_elastico_mole', label: 'Fica extremamente elástico/mole' },
      { value: 'rigido', label: 'Fica rígido' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },
  {
    id: 'estadoAtualDescricao',
    kind: 'multi',
    title: 'Qual dessas situações mais descreve seu cabelo hoje?',
    subtitle: 'Pode escolher mais de uma.',
    minSelected: 1,
    options: [
      { value: 'frizz_excessivo', label: 'Frizz excessivo' },
      { value: 'sem_brilho', label: 'Sem brilho' },
      { value: 'quebradico', label: 'Quebradiço' },
      { value: 'embaraca_muito', label: 'Embaraça muito' },
      { value: 'perde_definicao', label: 'Perde definição' },
      { value: 'saudavel_manutencao', label: 'Está saudável, quero só manutenção', exclusive: true },
      { value: 'outro', label: 'Outro' },
    ],
  },

  // ===== Ramificação masculina =====
  {
    id: 'recuoEntradasTopo',
    kind: 'single',
    title: 'Você percebeu recuo das entradas, aumento da área rala no topo, ou afinamento progressivo dos fios?',
    showIf: (a) => a.sexo === 'masculino',
    options: [
      { value: 'nao', label: 'Não' },
      { value: 'sim_leve', label: 'Sim, leve' },
      { value: 'sim_evidente', label: 'Sim, evidente' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },
  {
    id: 'historicoFamiliarQueda',
    kind: 'single',
    title: 'Existe histórico de queda ou afinamento de cabelo na sua família?',
    showIf: (a) => a.sexo === 'masculino',
    options: [
      { value: 'nao', label: 'Não que eu saiba' },
      { value: 'sim_lado_paterno', label: 'Sim, do lado paterno' },
      { value: 'sim_lado_materno', label: 'Sim, do lado materno' },
      { value: 'sim_ambos_lados', label: 'Sim, dos dois lados' },
      { value: 'nao_sei', label: 'Não sei' },
    ],
  },
  {
    id: 'cortaControlarRarefacao',
    kind: 'single',
    title: 'Você costuma raspar ou cortar bem curto para controlar a aparência da rarefação?',
    showIf: (a) => a.sexo === 'masculino',
    options: [
      { value: 'sim', label: 'Sim' },
      { value: 'nao', label: 'Não' },
    ],
  },
];

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

/**
 * Preenche respostas que ficam implícitas quando a pergunta correspondente é
 * pulada por não haver ambiguidade a resolver — ex: se só uma meta foi
 * escolhida, ela já é a prioridade, sem precisar perguntar de novo.
 */
export function applyDerivedDefaults(answers: Partial<QuestionnaireResponse>): Partial<QuestionnaireResponse> {
  const next = { ...answers };
  if (!next.objetivoPrioridade && next.objetivos?.length === 1) {
    next.objetivoPrioridade = next.objetivos[0];
  }
  return next;
}
