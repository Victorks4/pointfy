import type {
  UserRole,
  JustificativaTipo,
  StatusCompensacao,
  TipoDesafio,
} from '@/lib/types'

export type ProfileRow = {
  id: string
  email: string
  ra: string
  nome: string
  cargo: UserRole
  departamento: string
  carga_horaria_semanal: number
  data_inicio_recesso: string | null
  data_fim_recesso: string | null
  gestor_id: string | null
  created_at: string
}

export type PontoRegistroRow = {
  id: string
  user_id: string
  data: string
  entrada1: string | null
  saida1: string | null
  entrada2: string | null
  saida2: string | null
  total_minutos: number
  observacao: string | null
  justificativa_hora_extra: string | null
  created_at: string
  updated_at: string
}

export type JustificativaRow = {
  id: string
  user_id: string
  data: string
  tipo: JustificativaTipo
  descricao: string
  arquivo_path: string | null
  minutos_abatidos: number
  status_compensacao: StatusCompensacao | null
  gestor_id: string | null
  decidida_em: string | null
  motivo_rejeicao: string | null
  created_at: string
}

export type BloqueioPresencaRow = {
  id: string
  user_id: string | null
  data_inicio: string
  data_fim: string | null
  motivo: string | null
  created_at: string
}

export type NotificacaoRow = {
  id: string
  user_id: string | null
  titulo: string
  mensagem: string
  created_at: string
}

export type DesafioSemanalRow = {
  id: string
  titulo: string
  descricao: string
  tipo: TipoDesafio
  meta: number
  recompensa: string
  data_inicio: string
  data_fim: string
  ativo: boolean
  created_at: string
}

export type DesafioProgressoRow = {
  id: string
  desafio_id: string
  user_id: string
  progresso_atual: number
  concluido: boolean
  concluido_em: string | null
}

export type PontoConfigRow = {
  id: string
  nome: string
  meta_diaria_minutos: number
  limite_minutos_sem_justificativa: number
  rejeitar_minutos_zero: boolean
  formato_decimal: 'americano' | 'brasileiro'
  horario_entrada_esperado: string
  ativo: boolean
  padrao: boolean
  created_at: string
}
