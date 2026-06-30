import { z } from 'zod'
import { LOTACOES } from '@/lib/lotacoes'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const timeField = z
  .union([z.literal(''), z.string().regex(timeRegex, 'Horário inválido (use HH:mm)')])
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional()

export const pontoInputSchema = z.object({
  data: z.string().regex(dateRegex, 'Data inválida'),
  entrada1: timeField,
  saida1: timeField,
  entrada2: timeField,
  saida2: timeField,
  totalMinutos: z.number().int().min(0, 'Total de minutos inválido'),
  observacao: z.string().nullable().optional(),
  justificativaHoraExtra: z.string().nullable().optional(),
})

export const pontoUpdateSchema = pontoInputSchema.partial()

export const justificativaInputSchema = z
  .object({
    data: z.string().regex(dateRegex),
    tipo: z.enum(['atestado', 'compensacao', 'compensacao_parcial']),
    descricao: z.string().min(1),
    arquivoPath: z.string().nullable().optional(),
    dataCompensacao: z.string().regex(dateRegex).nullable().optional(),
    minutosSolicitados: z.number().int().positive().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.tipo === 'compensacao_parcial') {
      if (!val.dataCompensacao) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data da compensação é obrigatória' })
      }
      if (!val.minutosSolicitados || val.minutosSolicitados <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Horas da compensação são obrigatórias' })
      }
    }
  })

const recessoPeriodSchema = z
  .object({
    inicio: z.string().regex(dateRegex).nullable(),
    fim: z.string().regex(dateRegex).nullable(),
  })
  .refine(
    (p) => !p.inicio || !p.fim || p.fim >= p.inicio,
    { message: 'Fim do recesso deve ser após o início' },
  )

const usuarioFieldsSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6).optional(),
  matricula: z.string().min(1),
  nome: z.string().min(1),
  cargo: z.enum(['estagiario', 'admin', 'gestor']),
  departamento: z
    .string()
    .min(1, 'Lotação é obrigatória')
    .refine((v) => (LOTACOES as readonly string[]).includes(v), {
      message: 'Selecione uma lotação válida',
    }),
  cargaHorariaSemanal: z.number().int().positive(),
  dataInicioContrato: z.string().regex(dateRegex).nullable().optional(),
  dataFimContrato: z.string().regex(dateRegex).nullable().optional(),
  dataInicioRecesso1: z.string().regex(dateRegex).nullable().optional(),
  dataFimRecesso1: z.string().regex(dateRegex).nullable().optional(),
  dataInicioRecesso2: z.string().regex(dateRegex).nullable().optional(),
  dataFimRecesso2: z.string().regex(dateRegex).nullable().optional(),
  gestorId: z.string().uuid().nullable().optional(),
  gestorIds: z.array(z.string().uuid()).optional(),
  mustChangePassword: z.boolean().optional(),
})

function validateUsuarioRecessos(
  u: {
    dataInicioRecesso1?: string | null
    dataFimRecesso1?: string | null
    dataInicioRecesso2?: string | null
    dataFimRecesso2?: string | null
  },
  ctx: z.RefinementCtx,
) {
  for (const [key, period] of [
    ['recesso1', { inicio: u.dataInicioRecesso1, fim: u.dataFimRecesso1 }],
    ['recesso2', { inicio: u.dataInicioRecesso2, fim: u.dataFimRecesso2 }],
  ] as const) {
    const parsed = recessoPeriodSchema.safeParse(period)
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Período de ${key} inválido`,
      })
    }
  }
}

function validateEstagiarioGestor(
  u: { cargo?: string; gestorId?: string | null },
  ctx: z.RefinementCtx,
) {
  if (u.cargo === 'estagiario' && !u.gestorId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Gestor principal é obrigatório para estagiário',
      path: ['gestorId'],
    })
  }
}

export const usuarioInputSchema = usuarioFieldsSchema
  .refine(
    (u) => !u.dataInicioContrato || !u.dataFimContrato || u.dataFimContrato >= u.dataInicioContrato,
    { message: 'Fim do contrato deve ser após o início' },
  )
  .superRefine((u, ctx) => {
    validateUsuarioRecessos(u, ctx)
    validateEstagiarioGestor(u, ctx)
  })

export const usuarioUpdateSchema = usuarioFieldsSchema
  .partial()
  .refine(
    (u) => !u.dataInicioContrato || !u.dataFimContrato || u.dataFimContrato >= u.dataInicioContrato,
    { message: 'Fim do contrato deve ser após o início' },
  )
  .superRefine((u, ctx) => {
    validateUsuarioRecessos(u, ctx)
    if (u.cargo === 'estagiario' && u.gestorId === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Gestor principal é obrigatório para estagiário',
        path: ['gestorId'],
      })
    }
  })

export const changePasswordSchema = z
  .object({
    senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmacao: z.string().min(6),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: 'As senhas não coincidem',
    path: ['confirmacao'],
  })

export const feriadoInputSchema = z.object({
  data: z.string().regex(dateRegex),
  nome: z.string().min(1),
  tipo: z.enum(['nacional', 'municipal', 'empresa']),
  recorrente: z.boolean().optional(),
})

export const bloqueioInputSchema = z.object({
  userId: z.string().uuid().nullable(),
  dataInicio: z.string().regex(dateRegex),
  dataFim: z.string().regex(dateRegex).nullable().optional(),
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
  dataInicio: z.string().regex(dateRegex),
  dataFim: z.string().regex(dateRegex),
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
  minutosAprovados: z.number().int().positive().optional(),
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
