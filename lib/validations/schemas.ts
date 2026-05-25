import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const pontoInputSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entrada1: z.string().regex(timeRegex).nullable().optional(),
  saida1: z.string().regex(timeRegex).nullable().optional(),
  entrada2: z.string().regex(timeRegex).nullable().optional(),
  saida2: z.string().regex(timeRegex).nullable().optional(),
  totalMinutos: z.number().int().min(0),
  observacao: z.string().nullable().optional(),
  justificativaHoraExtra: z.string().nullable().optional(),
})

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
