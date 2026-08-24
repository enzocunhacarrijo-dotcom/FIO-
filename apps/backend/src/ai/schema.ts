// Mirrors @hair-analysis/shared's analysisAiOutputSchema field-for-field, but
// built with `zod/v4` instead of the package's default v3 API. The SDK's
// zodOutputFormat() calls zod/v4's toJSONSchema() internally, which reads
// internals (`.def`) that don't exist on a v3-constructed schema — passing a
// plain `zod` schema here fails at runtime, not just in types. Keeping this
// duplicate isolated to the backend avoids pulling zod/v4 into the mobile
// bundle, which never needs it.
import { z } from "zod/v4";

const confianca = z.enum(["alta", "media", "baixa"]);
const fonte = z.enum(["foto", "questionario", "ambos"]);
const rastreavel = { confianca, fonte };

export const analysisAiOutputSchemaV4 = z.object({
  curvatura: z.object({
    valor: z.enum(["liso", "ondulado", "cacheado", "crespo"]),
    subtipo: z.string(),
    ...rastreavel,
  }),
  densidadeAparente: z.object({
    valor: z.enum(["baixa", "media", "alta"]),
    ...rastreavel,
  }),
  porosidadeEstimada: z.object({
    valor: z.enum(["baixa", "media", "alta"]),
    ...rastreavel,
  }),
  couroCabeludo: z.object({
    oleosidade: z.enum(["seco", "equilibrado", "oleoso"]),
    descamacao: z.enum(["nao", "pouca", "bastante"]),
    vermelhidao: z.enum(["nao", "pouca", "bastante"]),
    ...rastreavel,
  }),
  integridadeDoFio: z.object({
    frizz: z.enum(["baixo", "medio", "alto"]),
    quebra: z.enum(["baixa", "media", "alta"]),
    pontasDuplas: z.enum(["poucas", "moderadas", "muitas"]),
    brilho: z.enum(["baixo", "medio", "alto"]),
    ...rastreavel,
  }),
  sinaisDeDano: z.object({
    quimico: z.boolean(),
    termico: z.boolean(),
    mecanico: z.boolean(),
    observacoes: z.string(),
  }),
  subScores: z.object({
    hidratacao: z.number().min(0).max(100),
    integridade: z.number().min(0).max(100),
    couro: z.number().min(0).max(100),
    densidade: z.number().min(0).max(100),
  }),
  necessidadesPrioritarias: z.array(z.string()),
  ingredientesRecomendados: z.array(z.object({ nome: z.string(), porQue: z.string() })),
  ingredientesAEvitar: z.array(z.object({ nome: z.string(), porQue: z.string() })),
  rotinaSemanal: z.array(
    z.object({
      dia: z.enum(["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]),
      acoes: z.array(z.string()),
    }),
  ),
  observacoesAoUsuario: z.string(),
  sinalDeAlertaMedico: z.boolean(),
  motivoAlerta: z.string().nullable(),
  qualidadeDasImagens: z.object({
    suficiente: z.boolean(),
    problemas: z.array(z.string()),
  }),
});
