import { z } from "zod";

export const compatibilidadeSchema = z.enum(["compativel", "neutro", "evitar"]);
export type Compatibilidade = z.infer<typeof compatibilidadeSchema>;

export const ingredienteAvaliadoSchema = z.object({
  nome: z.string(),
  avaliacao: compatibilidadeSchema,
  justificativa: z.string(),
});
export type IngredienteAvaliado = z.infer<typeof ingredienteAvaliadoSchema>;

/** Exact shape requested from — and validated against — the model. */
export const scanAiOutputSchema = z.object({
  produtoIdentificado: z.string().nullable(),
  compatibilidadeGeral: compatibilidadeSchema,
  resumo: z.string(),
  ingredientesAvaliados: z.array(ingredienteAvaliadoSchema),
  leituraSuficiente: z.boolean(),
  problemasLeitura: z.array(z.string()),
});
export type ScanAiOutput = z.infer<typeof scanAiOutputSchema>;

export const scanResultSchema = scanAiOutputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
});
export type ScanResult = z.infer<typeof scanResultSchema>;
