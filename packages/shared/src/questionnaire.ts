import { z } from "zod";

// Mantido por compatibilidade com o campo `users.objetivoPrincipal` já
// persistido no backend. O onboarding atual não grava mais este valor (a
// meta do usuário agora é capturada em `objetivos`/`objetivoPrioridade`,
// dentro do próprio questionário) — mas o tipo continua existindo porque a
// coluna e a rota `/api/me/objetivo` seguem no backend.
export const objetivoPrincipalSchema = z.enum(["qualidade_do_fio", "densidade_e_queda", "ambos"]);
export type ObjetivoPrincipal = z.infer<typeof objetivoPrincipalSchema>;

export const sexoSchema = z.enum(["masculino", "feminino", "prefiro_nao_informar"]);
export type Sexo = z.infer<typeof sexoSchema>;

export const objetivoCapilarSchema = z.enum([
  "reduzir_queda",
  "reduzir_quebra",
  "deixar_crescer",
  "aumentar_volume",
  "controlar_oleosidade",
  "reduzir_ressecamento",
  "reduzir_frizz",
  "melhorar_definicao_cachos",
  "recuperar_danificado",
  "melhorar_brilho_maciez",
  "cuidar_couro_cabeludo",
  "manter_saudavel",
  "outro",
]);
export type ObjetivoCapilar = z.infer<typeof objetivoCapilarSchema>;

export const questionnaireResponseSchema = z.object({
  // Bloco A — perfil básico
  sexo: sexoSchema,
  faixaEtaria: z.enum(["ate_17", "18_24", "25_34", "35_44", "45_54", "55_64", "65_mais"]),
  objetivos: z.array(objetivoCapilarSchema).min(1),
  objetivoPrioridade: objetivoCapilarSchema,

  // Bloco B — características do cabelo (autopercepção; densidade fica só
  // por conta da foto, que já é o instrumento melhor pra isso)
  curvatura: z.enum(["liso", "levemente_ondulado", "ondulado", "cacheado", "muito_cacheado", "crespo", "nao_sei"]),
  espessuraFio: z.enum(["muito_fino", "fino", "medio", "grosso", "muito_grosso", "nao_sei"]),
  comprimento: z.enum(["raspado_muito_curto", "curto", "medio", "longo", "muito_longo"]),

  // Bloco C — couro cabeludo
  tempoOleosidadeRaiz: z.enum(["menos_24h", "um_dois_dias", "tres_quatro_dias", "mais_4_dias", "nunca_percebi"]),
  sintomasCouroCabeludo: z
    .array(
      z.enum([
        "nenhum",
        "caspa_descamacao",
        "coceira",
        "vermelhidao",
        "sensibilidade_ardencia",
        "feridas",
        "espinhas_pustulas",
        "dor",
        "outro",
      ]),
    )
    .min(1),
  duracaoSintomasCouroCabeludo: z.enum(["menos_4_semanas", "mais_4_semanas", "recorrente"]).nullable(),

  quedaPercebida: z.enum(["nao", "sim_leve", "sim_bastante", "nao_sei"]),
  tipoQueda: z.enum(["fios_inteiros", "quebra_no_meio", "ambos", "nao_sei"]).nullable(),
  inicioQueda: z.enum(["menos_1_mes", "um_tres_meses", "tres_seis_meses", "mais_6_meses"]).nullable(),
  padraoQueda: z.enum(["difusa", "concentrada_uma_area", "entradas_ou_topo", "nao_sei"]).nullable(),
  areasFalhadas: z.enum(["sim", "nao", "nao_sei"]).nullable(),
  eventosRecentesRelevantes: z.array(
    z.enum([
      "doenca_febril",
      "cirurgia",
      "parto_pos_parto",
      "perda_peso_importante",
      "dieta_restritiva_severa",
      "estresse_intenso",
      "mudanca_medicamentos",
      "nenhum_evento",
    ]),
  ),

  // Bloco D — histórico químico
  historicoQuimica: z
    .array(z.enum(["nenhum", "coloracao", "descoloracao_luzes_mechas", "relaxamento", "permanente", "progressiva", "outro"]))
    .min(1),
  frequenciaQuimica: z.enum(["a_cada_1_2_meses", "a_cada_3_4_meses", "a_cada_5_6_meses", "raramente"]).nullable(),
  tempoUltimaQuimica: z.enum(["menos_1_mes", "um_seis_meses", "seis_doze_meses", "mais_1_ano"]).nullable(),

  // Bloco E — calor e manipulação
  frequenciaUsoCalor: z.enum([
    "nunca",
    "raramente",
    "uma_duas_vezes_semana",
    "tres_cinco_vezes_semana",
    "quase_todos_os_dias",
  ]),
  ferramentasCalor: z.array(z.enum(["secador", "chapinha", "babyliss_modelador", "escova_secadora", "outro"])),
  protetorTermico: z.enum(["sempre", "as_vezes", "nunca", "nao_sei_o_que_e"]).nullable(),
  temperaturaCalorPercebida: z.enum(["baixa", "media", "alta", "nao_sei"]).nullable(),

  // Bloco F — rotina de lavagem
  frequenciaLavagem: z.enum([
    "todos_os_dias",
    "cinco_seis_por_semana",
    "tres_quatro_por_semana",
    "uma_duas_por_semana",
    "menos_de_uma_por_semana",
  ]),
  produtosLavagem: z.array(z.enum(["xampu", "xampu_anticaspa", "co_wash", "condicionador", "mascara", "outros"])).min(1),
  limpezaProfundaOcasional: z.enum(["sim", "nao", "nao_sei"]).nullable(),

  // Bloco G — produtos atuais e restrições (condicionador/máscara já vêm do
  // Bloco F — aqui só o que ainda não foi perguntado)
  produtosAtuaisTipos: z
    .array(
      z.enum([
        "nenhum",
        "leave_in",
        "creme_pentear",
        "oleo",
        "serum",
        "gel",
        "pomada",
        "cera",
        "spray",
        "protetor_termico",
        "produto_anticaspa",
        "produto_antiqueda",
        "outro",
      ]),
    )
    .min(1),
  restricoes: z.array(z.enum(["vegano", "sem_sulfato", "sem_silicone", "low_poo", "orcamento", "nenhuma"])).min(1),

  // Bloco H — ambiente e estilo de vida (uma pergunta só; frequência exata
  // importa menos do que "isso é ou não parte da sua rotina")
  exposicaoAmbiental: z.array(
    z.enum(["piscina", "mar", "sauna", "treino_com_suor", "sol_prolongado", "nenhuma"]),
  ),

  // Bloco I — manipulação, penteados e tração (só perguntado quando relevante)
  prendeCabeloFrequencia: z.enum(["nao", "as_vezes", "frequentemente"]).nullable(),
  penteadosApertados: z.array(z.enum(["trancas", "extensoes_apliques", "rabo_coque_apertado", "nenhum"])),
  dificuldadeDesembaraco: z.enum(["nenhuma", "um_pouco", "muita"]).nullable(),

  // Bloco J — comportamento funcional (substitui "porosidade" e o teste do copo d'água)
  respostaProdutoHidratante: z.enum([
    "absorve_rapido_continua_seco",
    "fica_macio_equilibrado",
    "produto_fica_por_cima",
    "fica_pesado_oleoso_facil",
    "nao_sei",
  ]),
  comportamentoMolhado: z.enum([
    "fragil_quebra_facil",
    "elastico_maleavel_normal",
    "muito_elastico_mole",
    "rigido",
    "nao_sei",
  ]),
  estadoAtualDescricao: z
    .array(
      z.enum([
        "frizz_excessivo",
        "sem_brilho",
        "quebradico",
        "embaraca_muito",
        "perde_definicao",
        "saudavel_manutencao",
        "outro",
      ]),
    )
    .min(1),

  // Ramificação masculina (perguntada sempre que sexo = masculino, independente de queda relatada)
  recuoEntradasTopo: z.enum(["nao", "sim_leve", "sim_evidente", "nao_sei"]).nullable(),
  historicoFamiliarQueda: z.enum(["nao", "sim_lado_paterno", "sim_lado_materno", "sim_ambos_lados", "nao_sei"]).nullable(),
  cortaControlarRarefacao: z.enum(["sim", "nao"]).nullable(),
});
export type QuestionnaireResponse = z.infer<typeof questionnaireResponseSchema>;

export const questionnaireSubmitRequestSchema = z.object({
  respostas: questionnaireResponseSchema,
});

export const questionnaireRecordSchema = z.object({
  id: z.string(),
  respostas: questionnaireResponseSchema,
  createdAt: z.string(),
});
export type QuestionnaireRecord = z.infer<typeof questionnaireRecordSchema>;

// ---------------------------------------------------------------------------
// Red flags: sinais que, segundo a literatura (seção 8.7 do estudo de
// referência), ultrapassam o território cosmético e sugerem avaliação
// dermatológica. Calculados de forma determinística a partir das respostas —
// nunca "diagnosticados" — para dar à IA um contexto explícito, em vez de
// depender só da sua leitura do JSON bruto.
// ---------------------------------------------------------------------------

export type QuestionnaireRedFlags = {
  /** Algum sinal sugere que vale conversar com um dermatologista. */
  sugereAvaliacaoMedica: boolean;
  /** Descrições curtas, em linguagem simples, de cada sinal identificado. */
  motivos: string[];
  /** Combinação química de alto risco de quebra (ex: descoloração + alisamento). Alerta cosmético, não médico. */
  combinacaoQuimicaAltoRisco: boolean;
};

export function computeQuestionnaireRedFlags(r: QuestionnaireResponse): QuestionnaireRedFlags {
  const motivos: string[] = [];

  const sintomas = new Set(r.sintomasCouroCabeludo);
  if (sintomas.has("feridas")) motivos.push("Relatou feridas no couro cabeludo.");
  if (sintomas.has("dor")) motivos.push("Relatou dor no couro cabeludo.");
  if (sintomas.has("espinhas_pustulas")) motivos.push("Relatou pústulas/espinhas no couro cabeludo.");
  if ((sintomas.has("vermelhidao") || sintomas.has("caspa_descamacao") || sintomas.has("coceira")) &&
    r.duracaoSintomasCouroCabeludo === "mais_4_semanas") {
    motivos.push("Descamação, coceira ou vermelhidão persistente há mais de 4 semanas sem melhora.");
  }

  const quedaRelevante = r.quedaPercebida === "sim_bastante" || r.tipoQueda === "fios_inteiros";
  if (quedaRelevante && r.areasFalhadas === "sim") {
    motivos.push("Queda associada a falhas localizadas/áreas sem cabelo bem delimitadas.");
  }
  if (quedaRelevante && r.padraoQueda === "concentrada_uma_area") {
    motivos.push("Queda concentrada em uma área específica, não difusa.");
  }
  if (quedaRelevante && r.inicioQueda === "menos_1_mes" && r.eventosRecentesRelevantes.some((e) => e !== "nenhum_evento")) {
    motivos.push("Queda súbita e recente, associada a evento de saúde, cirurgia, parto ou mudança de peso/dieta.");
  }

  if (r.sexo === "masculino" && r.cortaControlarRarefacao === "sim" && r.recuoEntradasTopo === "sim_evidente") {
    // Não é um red flag médico por si só (é o território de tratamento com melhor evidência,
    // mas ainda assim médico/dermatológico) — registrado como motivo informativo, não urgente.
    motivos.push("Recuo evidente de entradas/topo — padrão com tratamento médico bem estabelecido (avaliação dermatológica recomendada).");
  }

  const historico = new Set(r.historicoQuimica);
  const fezDescoloracaoOuMechas = historico.has("descoloracao_luzes_mechas");
  const fezAlisamentoOuRelaxamento = historico.has("relaxamento") || historico.has("progressiva");
  const combinacaoQuimicaAltoRisco = fezDescoloracaoOuMechas && fezAlisamentoOuRelaxamento;

  return {
    sugereAvaliacaoMedica: motivos.length > 0,
    motivos,
    combinacaoQuimicaAltoRisco,
  };
}
