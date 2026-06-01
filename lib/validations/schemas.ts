import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const timeField = z
  .union([z.literal(''), z.string().regex(timeRegex, 'Horário inválido (use HH:mm)')])
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional()

export const pontoInputSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  entrada1: timeField,
  saida1: timeField,
  entrada2: timeField,
  saida2: timeField,
  totalMinutos: z.number().int().min(0, 'Total de minutos inválido'),
  observacao: z.string().nullable().optional(),
  justificativaHoraExtra: z.string().nullable().optional(),
})

export const pontoUpdateSchema = pontoInputSchema.partial()

export const justificativaInputSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipo: z.enum(['atestado', 'compensacao']),
  descricao: z.string().min(1),
  arquivoPath: z.string().nullable().optional(),
})

export const usuarioInputSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6).optional(),
  ra: z.string().min(1),
  nome: z.string().min(1),
  cargo: z.enum(['estagiario', 'admin', 'gestor']),
  departamento: z.string(),
  cargaHorariaSemanal: z.number().int().positive(),
  dataInicioRecesso: z.string().nullable().optional(),
  dataFimRecesso: z.string().nullable().optional(),
  gestorId: z.string().uuid().nullable().optional(),
})

export const bloqueioInputSchema = z.object({
  userId: z.string().uuid().nullable(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  motivo: z.string().nullable().optional(),
})

export const notificacaoInputSchema = z.object({
  userId: z.string().uuid().nullable(),
  titulo: z.string().min(1),
  mensagem: z.string().min(1),
})

export const desafioInputSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string(),
  tipo: z.enum(['meta_horas', 'streak', 'pontualidade', 'custom']),
  meta: z.number().int(),
  recompensa: z.string(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ativo: z.boolean(),
})

export const pontoConfigInputSchema = z.object({
  nome: z.string().min(1),
  metaDiariaMinutos: z.number().int().positive(),
  limiteMinutosSemJustificativa: z.number().int().positive(),
  rejeitarMinutosZero: z.boolean(),
  formatoDecimal: z.enum(['americano', 'brasileiro']),
  horarioEntradaEsperado: z.string().regex(timeRegex),
  ativo: z.boolean(),
  padrao: z.boolean().optional(),
})

export const compensacaoDecisionSchema = z.object({
  justificativaId: z.string().uuid('ID da justificativa inválido'),
  motivoRejeicao: z.string().optional(),
})

export const desafioProgressoSchema = z.object({
  userId: z.string().uuid(),
  desafioId: z.string().uuid(),
  progressoAtual: z.number().int().min(0),
  concluido: z.boolean(),
})

export const notificacaoReadSchema = z.object({
  notificacaoId: z.string().uuid(),
  userId: z.string().uuid(),
})

export const ALLOWED_UPLOAD_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Arquivo muito grande (máximo 5MB)'
  }
  if (!ALLOWED_UPLOAD_MIME.includes(file.type as (typeof ALLOWED_UPLOAD_MIME)[number])) {
    return 'Tipo de arquivo não permitido (use PDF, JPG ou PNG)'
  }
  return null
}
