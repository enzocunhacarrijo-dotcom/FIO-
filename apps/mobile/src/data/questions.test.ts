import { describe, expect, it } from 'vitest';
import { computeQuestionnaireRedFlags, questionnaireResponseSchema, type QuestionnaireResponse } from '@hair-analysis/shared';
import { applyDerivedDefaults, QUESTIONS, resolveOptions, type Question } from './questions';
import { initialAnswers } from '../store/questionnaire';

// Perfil "homem sem problemas capilares": todo campo sempre-visível recebe
// uma resposta neutra/saudável. Cada cenário parte daqui e sobrescreve só o
// que muda — assim, qualquer pergunta que "vaze" para um fluxo que não devia
// vê-la fica evidente no diff dos ids visíveis.
const BASELINE: Partial<QuestionnaireResponse> = {
  sexo: 'masculino',
  faixaEtaria: '25_34',
  objetivos: ['manter_saudavel'],
  curvatura: 'liso',
  espessuraFio: 'medio',
  comprimento: 'curto',
  tempoOleosidadeRaiz: 'tres_quatro_dias',
  sintomasCouroCabeludo: ['nenhum'],
  quedaPercebida: 'nao',
  historicoQuimica: ['nenhum'],
  frequenciaUsoCalor: 'nunca',
  frequenciaLavagem: 'tres_quatro_por_semana',
  produtosLavagem: ['xampu', 'condicionador'],
  produtosAtuaisTipos: ['nenhum'],
  restricoes: ['nenhuma'],
  exposicaoAmbiental: ['nenhuma'],
  respostaProdutoHidratante: 'fica_macio_equilibrado',
  comportamentoMolhado: 'elastico_maleavel_normal',
  estadoAtualDescricao: ['saudavel_manutencao'],
  // Perguntas incondicionais para sexo masculino (ver spec seção 5).
  recuoEntradasTopo: 'nao',
  historicoFamiliarQueda: 'nao',
  cortaControlarRarefacao: 'nao',
};

function visible(answers: Partial<QuestionnaireResponse>): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

function visibleIds(answers: Partial<QuestionnaireResponse>): string[] {
  return visible(answers).map((q) => q.id as string);
}

/** Monta uma resposta completa como se um usuário real tivesse terminado o
 * fluxo: começa dos defaults de "pergunta não aplicável" (iguais aos do
 * store), empilha o baseline saudável, e por cima as particularidades do
 * cenário. */
function scenario(overrides: Partial<QuestionnaireResponse>): Partial<QuestionnaireResponse> {
  return applyDerivedDefaults({ ...initialAnswers, ...BASELINE, ...overrides });
}

function expectValid(answers: Partial<QuestionnaireResponse>) {
  const parsed = questionnaireResponseSchema.safeParse(answers);
  if (!parsed.success) {
    throw new Error(`Resposta não passou no schema: ${JSON.stringify(parsed.error.flatten(), null, 2)}`);
  }
  return parsed.data;
}

describe('onboarding adaptativo — cada pergunta tem que ter motivo pra aparecer', () => {
  it('1) homem sem problemas capilares: nenhum bloco de aprofundamento aparece', () => {
    const a = scenario({});
    expectValid(a);
    const ids = visibleIds(a);

    // Bloco masculino incondicional continua visível...
    expect(ids).toEqual(expect.arrayContaining(['recuoEntradasTopo', 'historicoFamiliarQueda', 'cortaControlarRarefacao']));
    // ...mas nada de aprofundamento de queda, química, calor ou tração.
    for (const id of [
      'objetivoPrioridade', // só 1 objetivo escolhido
      'duracaoSintomasCouroCabeludo',
      'tipoQueda',
      'inicioQueda',
      'padraoQueda',
      'areasFalhadas',
      'eventosRecentesRelevantes',
      'frequenciaQuimica',
      'tempoUltimaQuimica',
      'ferramentasCalor',
      'protetorTermico',
      'temperaturaCalorPercebida',
      'limpezaProfundaOcasional',
      'prendeCabeloFrequencia',
      'penteadosApertados',
      'dificuldadeDesembaraco',
    ]) {
      expect(ids, `"${id}" não deveria aparecer nesse fluxo`).not.toContain(id);
    }
  });

  it('2) homem com queda: aprofunda queda e passa a investigar tração (queda também traz tração)', () => {
    const a = scenario({
      quedaPercebida: 'sim_bastante',
      tipoQueda: 'fios_inteiros',
      inicioQueda: 'tres_seis_meses',
      padraoQueda: 'entradas_ou_topo',
      areasFalhadas: 'nao',
      eventosRecentesRelevantes: ['nenhum_evento'],
      prendeCabeloFrequencia: 'nao',
      dificuldadeDesembaraco: 'nenhuma',
    });
    expectValid(a);
    const ids = visibleIds(a);

    expect(ids).toEqual(
      expect.arrayContaining(['tipoQueda', 'inicioQueda', 'padraoQueda', 'areasFalhadas', 'eventosRecentesRelevantes', 'prendeCabeloFrequencia']),
    );
    // Não prende o cabelo -> não faz sentido perguntar sobre penteados apertados.
    expect(ids).not.toContain('penteadosApertados');
    // Segue sem química/calor -> nada disso aparece.
    expect(ids).not.toContain('frequenciaQuimica');
    expect(ids).not.toContain('ferramentasCalor');

    // A opção de gravidez/pós-parto nunca aparece pra homem.
    const eventosQuestion = QUESTIONS.find((q) => q.id === 'eventosRecentesRelevantes')!;
    const opts = resolveOptions(eventosQuestion, a).map((o) => o.value);
    expect(opts).not.toContain('parto_pos_parto');
  });

  it('3) homem com cabelo oleoso: oleosidade do couro cabeludo não é mais uma opção redundante em sintomas', () => {
    const a = scenario({
      tempoOleosidadeRaiz: 'menos_24h',
      objetivos: ['controlar_oleosidade'],
    });
    const valid = expectValid(a);
    // "oleosidade_excessiva" foi removida de sintomasCouroCabeludo por duplicar tempoOleosidadeRaiz —
    // não deve nem existir mais como opção válida do schema.
    const sintomasQuestion = QUESTIONS.find((q) => q.id === 'sintomasCouroCabeludo')!;
    const opts = resolveOptions(sintomasQuestion, a).map((o) => o.value);
    expect(opts).not.toContain('oleosidade_excessiva');
    expect(valid.tempoOleosidadeRaiz).toBe('menos_24h');
  });

  it('4) mulher com cabelo longo e quimicamente tratado (descoloração + relaxamento): investiga química e tração, ignora ramo masculino', () => {
    const a = scenario({
      sexo: 'feminino',
      comprimento: 'longo',
      historicoQuimica: ['descoloracao_luzes_mechas', 'relaxamento'],
      frequenciaQuimica: 'a_cada_3_4_meses',
      tempoUltimaQuimica: 'um_seis_meses',
      prendeCabeloFrequencia: 'frequentemente',
      penteadosApertados: ['rabo_coque_apertado'],
      dificuldadeDesembaraco: 'um_pouco',
      // campos masculinos não fazem sentido pra esse perfil
      recuoEntradasTopo: null,
      historicoFamiliarQueda: null,
      cortaControlarRarefacao: null,
    });
    const valid = expectValid(a);
    const ids = visibleIds(a);

    expect(ids).toEqual(expect.arrayContaining(['frequenciaQuimica', 'tempoUltimaQuimica', 'prendeCabeloFrequencia', 'penteadosApertados', 'dificuldadeDesembaraco']));
    for (const id of ['recuoEntradasTopo', 'historicoFamiliarQueda', 'cortaControlarRarefacao']) {
      expect(ids, `"${id}" é um campo do ramo masculino e não deveria aparecer para sexo feminino`).not.toContain(id);
    }

    // O estudo (seção 6.5) trata descoloração + relaxamento/progressiva como combinação de alto risco de quebra.
    expect(computeQuestionnaireRedFlags(valid).combinacaoQuimicaAltoRisco).toBe(true);
  });

  it('5) mulher com queda recente e intensa: pergunta de eventos recentes inclui a opção de pós-parto e o app sinaliza o padrão como digno de atenção', () => {
    const a = scenario({
      sexo: 'feminino',
      quedaPercebida: 'sim_bastante',
      tipoQueda: 'fios_inteiros',
      inicioQueda: 'menos_1_mes',
      padraoQueda: 'difusa',
      areasFalhadas: 'nao',
      eventosRecentesRelevantes: ['parto_pos_parto'],
      prendeCabeloFrequencia: 'nao',
      dificuldadeDesembaraco: 'nenhuma',
      recuoEntradasTopo: null,
      historicoFamiliarQueda: null,
      cortaControlarRarefacao: null,
    });
    const valid = expectValid(a);

    const eventosQuestion = QUESTIONS.find((q) => q.id === 'eventosRecentesRelevantes')!;
    const opts = resolveOptions(eventosQuestion, a).map((o) => o.value);
    expect(opts).toContain('parto_pos_parto');

    const flags = computeQuestionnaireRedFlags(valid);
    expect(flags.sugereAvaliacaoMedica).toBe(true);
    expect(flags.motivos.join(' ')).toMatch(/súbita|recente/);
  });

  it('6) cabelo cacheado/crespo: tração e desembaraço entram em pauta mesmo sem queda relatada', () => {
    const a = scenario({ curvatura: 'crespo', prendeCabeloFrequencia: 'as_vezes', penteadosApertados: ['trancas'], dificuldadeDesembaraco: 'muita' });
    expectValid(a);
    expect(visibleIds(a)).toEqual(expect.arrayContaining(['prendeCabeloFrequencia', 'dificuldadeDesembaraco', 'penteadosApertados']));
  });

  it('7) cabelo liso fino, curto, sem queda: bloco de tração inteiro fica de fora', () => {
    const a = scenario({ curvatura: 'liso', espessuraFio: 'muito_fino', comprimento: 'curto', quedaPercebida: 'nao' });
    expectValid(a);
    const ids = visibleIds(a);
    for (const id of ['prendeCabeloFrequencia', 'penteadosApertados', 'dificuldadeDesembaraco']) {
      expect(ids).not.toContain(id);
    }
  });

  it('8) usuário que frequenta muita piscina: uma única pergunta de ambiente, sem pergunta técnica extra', () => {
    const baseline = scenario({});
    const comPiscina = scenario({ exposicaoAmbiental: ['piscina'] });
    expectValid(comPiscina);
    // A pergunta em si é sempre visível; o que garantimos aqui é que respondê-la
    // não desbloqueia nenhum campo técnico (ex: nada de "dureza da água").
    expect(visibleIds(comPiscina)).toEqual(visibleIds(baseline));
  });

  it('9) usuário que nunca fez química: nada de frequência/recência química', () => {
    const a = scenario({ historicoQuimica: ['nenhum'] });
    expectValid(a);
    const ids = visibleIds(a);
    expect(ids).not.toContain('frequenciaQuimica');
    expect(ids).not.toContain('tempoUltimaQuimica');
  });

  it('10) usuário com sintomas persistentes no couro cabeludo: aprofunda duração e o app sinaliza avaliação médica', () => {
    const a = scenario({ sintomasCouroCabeludo: ['caspa_descamacao', 'coceira'], duracaoSintomasCouroCabeludo: 'mais_4_semanas' });
    const valid = expectValid(a);
    expect(visibleIds(a)).toContain('duracaoSintomasCouroCabeludo');

    const flags = computeQuestionnaireRedFlags(valid);
    expect(flags.sugereAvaliacaoMedica).toBe(true);
    expect(flags.motivos.join(' ')).toMatch(/persistente/);
  });

  it('11) usuário que prefere não informar o sexo: nenhuma pergunta do ramo masculino aparece e a validação continua passando', () => {
    const a = scenario({
      sexo: 'prefiro_nao_informar',
      recuoEntradasTopo: null,
      historicoFamiliarQueda: null,
      cortaControlarRarefacao: null,
    });
    expectValid(a);
    const ids = visibleIds(a);
    for (const id of ['recuoEntradasTopo', 'historicoFamiliarQueda', 'cortaControlarRarefacao']) {
      expect(ids).not.toContain(id);
    }
  });

  it('mais de uma meta escolhida: pergunta de prioridade aparece só com as metas selecionadas como opção', () => {
    const a = scenario({ objetivos: ['reduzir_queda', 'reduzir_frizz'], objetivoPrioridade: 'reduzir_queda' });
    expectValid(a);
    expect(visibleIds(a)).toContain('objetivoPrioridade');
    const q = QUESTIONS.find((qq) => qq.id === 'objetivoPrioridade')!;
    const opts = resolveOptions(q, a).map((o) => o.value);
    expect(opts.sort()).toEqual(['reduzir_frizz', 'reduzir_queda']);
  });

  it('só uma meta escolhida: prioridade é derivada automaticamente, sem perguntar de novo', () => {
    const a = scenario({ objetivos: ['reduzir_quebra'] });
    expect(visibleIds(a)).not.toContain('objetivoPrioridade');
    const valid = expectValid(a);
    expect(valid.objetivoPrioridade).toBe('reduzir_quebra');
  });

  it('não existem opções redundantes entre produtosLavagem e produtosAtuaisTipos', () => {
    const lavagem = QUESTIONS.find((q) => q.id === 'produtosLavagem')!;
    const atuais = QUESTIONS.find((q) => q.id === 'produtosAtuaisTipos')!;
    const lavagemValues = new Set(resolveOptions(lavagem, {}).map((o) => o.value));
    const atuaisValues = resolveOptions(atuais, {}).map((o) => o.value);
    for (const v of atuaisValues) {
      expect(lavagemValues.has(v), `"${v}" aparece em produtosAtuaisTipos e também em produtosLavagem`).toBe(false);
    }
  });

  it('nenhuma pergunta de múltipla escolha tem duas opções com o mesmo texto', () => {
    for (const q of QUESTIONS) {
      if (q.kind === 'text') continue;
      const opts = resolveOptions(q, {});
      const labels = opts.map((o) => o.label.toLowerCase());
      expect(new Set(labels).size, `pergunta "${q.id}" tem rótulos de opção duplicados: ${labels.join(', ')}`).toBe(labels.length);
    }
  });
});
