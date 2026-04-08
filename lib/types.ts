// Tipos do Sistema de Ponto

export type UserRole = 'estagiario' | 'admin' | 'gestor'

export interface User {
  id: string
  email: string
  ra: string
  nome: string
  cargo: UserRole
  departamento: string
  cargaHorariaSemanal: number // em minutos
  dataInicioRecesso: string | null
  dataFimRecesso: string | null
  createdAt: string
  /** Estagiário vinculado a um gestor (cadastro pelo admin). */
  gestorId?: string | null
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

export interface Justificativa {
  id: string
  userId: string
  data: string
  tipo: 'atestado' | 'compensacao'
  descricao: string
  arquivoUrl: string | null
  minutosAbatidos: number // Para compensação: 360 (6h)
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

export interface BancoHoras {
  userId: string
  saldoMinutos: number // positivo = horas extras, negativo = horas devendo
  mesAno: string // YYYY-MM
}

/** Assinatura em PNG (data URL) guardada no cliente — demo sem backend. */
export interface AssinaturaSalva {
  dataUrl: string
  atualizadoEm: string
}

/** Controle de assinaturas da folha de ponto mensal por estagiário. */
export interface FolhaPontoMensal {
  id: string
  estagiarioId: string
  gestorId: string
  mesAno: string
  gestorAssinouEm: string | null
  estagiarioAssinouEm: string | null
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
export const DIAS_RECESSO = 15
