// Tipos do Sistema de Ponto

export type UserRole = 'estagiario' | 'admin' | 'gestor'

export interface User {
  id: string
  email: string
  matricula: string
  nome: string
  cargo: UserRole
  departamento: string
  cargaHorariaSemanal: number // em minutos
  dataInicioContrato: string | null
  dataFimContrato: string | null
  dataInicioRecesso1: string | null
  dataFimRecesso1: string | null
  dataInicioRecesso2: string | null
  dataFimRecesso2: string | null
  mustChangePassword: boolean
  createdAt: string
  /** Gestor principal (legado + primário). */
  gestorId?: string | null
  /** Gestores adicionais (junction estagiario_gestores). */
  gestorIds?: string[]
}

export interface PontoRegistro {
  id: string
  userId: string
  data: string // YYYY-MM-DD
  entrada1: string | null // HH:mm
  saida1: string | null
  entrada2: string | null
  saida2: string | null
  totalMinutos: number
  observacao: string | null
  justificativaHoraExtra: string | null
  createdAt: string
  updatedAt: string
}

export type StatusCompensacao =
  | 'pendente_gestor'
  | 'aprovada_gestor'
  | 'rejeitada_gestor'

export type JustificativaTipo = 'atestado' | 'compensacao' | 'compensacao_parcial'

export interface Justificativa {
  id: string
  userId: string
  data: string
  tipo: JustificativaTipo
  descricao: string
  arquivoUrl: string | null
  minutosAbatidos: number
  createdAt: string
  /** Data em que o estagiário compensará (parcial). */
  dataCompensacao?: string | null
  /** Minutos solicitados na compensação parcial. */
  minutosSolicitados?: number | null
  /** Fluxo de compensação — atestado ignora estes campos */
  statusCompensacao?: StatusCompensacao
  gestorId?: string | null
  decididaEm?: string | null
  motivoRejeicao?: string | null
}

/** Bloqueio de registro de presença (admin). userId null = todos estagiários */
export interface BloqueioPresenca {
  id: string
  userId: string | null
  dataInicio: string
  dataFim: string | null
  motivo: string | null
  createdAt: string
}

export interface Notificacao {
  id: string
  userId: string | null // null = todos
  titulo: string
  mensagem: string
  lida: boolean
  createdAt: string
}

export type FeriadoTipo = 'nacional' | 'municipal' | 'empresa'

export interface Feriado {
  id: string
  data: string
  nome: string
  tipo: FeriadoTipo
  recorrente: boolean
  createdAt: string
}

export interface BancoHoras {
  userId: string
  saldoMinutos: number // positivo = horas extras, negativo = horas devendo
  mesAno: string // YYYY-MM
}

export type TipoDesafio = 'meta_horas' | 'streak' | 'pontualidade' | 'custom'

export interface DesafioSemanal {
  id: string
  titulo: string
  descricao: string
  tipo: TipoDesafio
  meta: number
  recompensa: string
  dataInicio: string
  dataFim: string
  ativo: boolean
  createdAt: string
}

export interface DesafioProgresso {
  id: string
  desafioId: string
  userId: string
  progressoAtual: number
  concluido: boolean
  concluidoEm: string | null
}

export interface PontoConfig {
  id: string
  nome: string
  metaDiariaMinutos: number
  limiteMinutosSemJustificativa: number
  rejeitarMinutosZero: boolean
  formatoDecimal: 'americano' | 'brasileiro'
  horarioEntradaEsperado: string
  ativo: boolean
  padrao: boolean
  createdAt: string
}

export const TIPO_DESAFIO_LABELS: Record<TipoDesafio, string> = {
  meta_horas: 'Meta de Horas',
  streak: 'Sequência',
  pontualidade: 'Pontualidade',
  custom: 'Personalizado',
}

// Justificativas pré-definidas para hora extra
export const JUSTIFICATIVAS_HORA_EXTRA = [
  'Alinhado com a coordenação',
  'Alto nível de demanda',
  'Projeto urgente',
  'Reunião estendida',
  'Treinamento',
  'Outro'
] as const

export type JustificativaHoraExtra = typeof JUSTIFICATIVAS_HORA_EXTRA[number]

// Constantes do sistema
export const LIMITE_MINUTOS_SEM_JUSTIFICATIVA = 370 // 6h10min = 370 minutos
export const MINUTOS_COMPENSACAO = 360 // 6h = 360 minutos
