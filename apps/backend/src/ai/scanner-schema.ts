// See schema.ts for why this mirrors @hair-analysis/shared's scanAiOutputSchema
// with zod/v4 instead of the package's default v3 API.
import { z } from "zod/v4";

export const scanAiOutputSchemaV4 = z.object({
  produtoIdentificado: z.string().nullable(),
  compatibilidadeGeral: z.enum(["compativel", "neutro", "evitar"]),
  resumo: z.string(),
  ingredientesAvaliados: z.array(
    z.object({
      nome: z.string(),
      avaliacao: z.enum(["compativel", "neutro", "evitar"]),
      justificativa: z.string(),
    }),
  ),
  leituraSuficiente: z.boolean(),
  problemasLeitura: z.array(z.string()),
});
