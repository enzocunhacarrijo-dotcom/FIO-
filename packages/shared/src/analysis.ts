import { z } from "zod";

export const confiancaSchema = z.enum(["alta", "media", "baixa"]);
export type Confianca = z.infer<typeof confiancaSchema>;

export const fonteSchema = z.enum(["foto", "questionario", "ambos"]);
export type Fonte = z.infer<typeof fonteSchema>;

const rastreavel = { confianca: confiancaSchema, fonte: fonteSchema };

export const curvaturaAnaliseSchema = z.object({
  valor: z.enum(["liso", "ondulado", "cacheado", "crespo"]),
  subtipo: z.string(),
  ...rastreavel,
});

export const densidadeAparenteSchema = z.object({
  valor: z.enum(["baixa", "media", "alta"]),
  ...rastreavel,
});

export const porosidadeEstimadaSchema = z.object({
  valor: z.enum(["baixa", "media", "alta"]),
  ...rastreavel,
});

export const couroCabeludoAnaliseSchema = z.object({
  oleosidade: z.enum(["seco", "equilibrado", "oleoso"]),
  descamacao: z.enum(["nao", "pouca", "bastante"]),
  vermelhidao: z.enum(["nao", "pouca", "bastante"]),
  ...rastreavel,
});

export const integridadeDoFioSchema = z.object({
  frizz: z.enum(["baixo", "medio", "alto"]),
  quebra: z.enum(["baixa", "media", "alta"]),
  pontasDuplas: z.enum(["poucas", "moderadas", "muitas"]),
  brilho: z.enum(["baixo", "medio", "alto"]),
  ...rastreavel,
});

export const sinaisDeDanoSchema = z.object({
  quimico: z.boolean(),
  termico: z.boolean(),
  mecanico: z.boolean(),
  observacoes: z.string(),
});

export const subScoresSchema = z.object({
  hidratacao: z.number().min(0).max(100),
  integridade: z.number().min(0).max(100),
  couro: z.number().min(0).max(100),
  densidade: z.number().min(0).max(100),
});

const ingredienteSchema = z.object({ nome: z.string(), porQue: z.string() });

export const diaDaSemanaSchema = z.enum(["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]);
export type DiaDaSemana = z.infer<typeof diaDaSemanaSchema>;

export const rotinaDiaSchema = z.object({ dia: diaDaSemanaSchema, acoes: z.array(z.string()) });

export const qualidadeDasImagensSchema = z.object({
  suficiente: z.boolean(),
  problemas: z.array(z.string()),
});

/** Exact shape requested from — and validated against — the model's structured output. */
export const analysisAiOutputSchema = z.object({
  curvatura: curvaturaAnaliseSchema,
  densidadeAparente: densidadeAparenteSchema,
  porosidadeEstimada: porosidadeEstimadaSchema,
  couroCabeludo: couroCabeludoAnaliseSchema,
  integridadeDoFio: integridadeDoFioSchema,
  sinaisDeDano: sinaisDeDanoSchema,
  subScores: subScoresSchema,
  necessidadesPrioritarias: z.array(z.string()),
  ingredientesRecomendados: z.array(ingredienteSchema),
  ingredientesAEvitar: z.array(ingredienteSchema),
  rotinaSemanal: z.array(rotinaDiaSchema),
  observacoesAoUsuario: z.string(),
  sinalDeAlertaMedico: z.boolean(),
  motivoAlerta: z.string().nullable(),
  qualidadeDasImagens: qualidadeDasImagensSchema,
});
export type AnalysisAiOutput = z.infer<typeof analysisAiOutputSchema>;

/** What gets persisted and returned to the client — AI output plus the
 * deterministic, backend-computed total (never trust the model's arithmetic). */
export const analysisResultSchema = analysisAiOutputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  indiceCapilar: subScoresSchema.extend({ total: z.number().min(0).max(100) }),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
