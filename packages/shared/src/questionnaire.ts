import { z } from "zod";

export const objetivoPrincipalSchema = z.enum(["qualidade_do_fio", "densidade_e_queda", "ambos"]);
export type ObjetivoPrincipal = z.infer<typeof objetivoPrincipalSchema>;

export const questionnaireResponseSchema = z.object({
  curvatura: z.enum(["liso", "ondulado", "cacheado", "crespo"]),
  comprimento: z.enum(["curto", "ombros", "medio", "longo"]),
  frequenciaLavagem: z.enum(["diaria", "dois_tres_dias", "semanal", "menos_semanal"]),
  usoCalor: z.array(z.enum(["secador", "chapinha", "babyliss"])),
  frequenciaCalor: z.enum(["diaria", "algumas_vezes_semana", "raramente"]).nullable(),
  historicoQuimica: z.array(
    z.enum(["coloracao", "descoloracao", "progressiva", "relaxamento", "permanente"]),
  ),
  tempoUltimaQuimica: z.enum(["menos_1_mes", "um_seis_meses", "seis_doze_meses", "mais_1_ano"]).nullable(),
  quedaPercebida: z.enum(["normal", "um_pouco_mais", "bem_mais", "intensa_ou_localizada"]),
  coceira: z.enum(["nunca", "as_vezes", "frequentemente"]),
  descamacao: z.enum(["nao", "pouca", "bastante"]),
  oleosidadeCouro: z.enum(["seco", "equilibrado", "oleoso"]),
  exposicaoAgua: z.array(z.enum(["tratada", "dura", "piscina", "mar", "nao_sei"])),
  produtosAtuais: z.string().max(500),
  objetivos: z
    .array(
      z.enum([
        "reduzir_frizz",
        "mais_volume",
        "menos_quebra",
        "definir_cacho",
        "controlar_oleosidade",
        "reduzir_queda",
        "hidratar",
      ]),
    )
    .min(1),
  restricoes: z.array(z.enum(["vegano", "sem_sulfato", "sem_silicone", "low_poo", "orcamento", "nenhuma"])),
  genero: z.enum(["feminino", "masculino", "nao_binario", "prefiro_nao_informar"]).nullable(),
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
