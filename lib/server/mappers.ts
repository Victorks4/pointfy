import type {
  User,
  PontoRegistro,
  Justificativa,
  BloqueioPresenca,
  Notificacao,
  DesafioSemanal,
  DesafioProgresso,
  PontoConfig,
} from '@/lib/types'
import type {
  ProfileRow,
  PontoRegistroRow,
  JustificativaRow,
  BloqueioPresencaRow,
  NotificacaoRow,
  DesafioSemanalRow,
  DesafioProgressoRow,
  PontoConfigRow,
} from './db-types'

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    ra: row.ra,
    nome: row.nome,
    cargo: row.cargo,
    departamento: row.departamento,
    cargaHorariaSemanal: row.carga_horaria_semanal,
    dataInicioRecesso: row.data_inicio_recesso,
    dataFimRecesso: row.data_fim_recesso,
    gestorId: row.gestor_id,
    createdAt: row.created_at,
  }
}

export function mapPonto(row: PontoRegistroRow): PontoRegistro {
  return {
    id: row.id,
    userId: row.user_id,
    data: row.data,
    entrada1: row.entrada1,
    saida1: row.saida1,
    entrada2: row.entrada2,
    saida2: row.saida2,
    totalMinutos: row.total_minutos,
    observacao: row.observacao,
    justificativaHoraExtra: row.justificativa_hora_extra,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapJustificativa(row: JustificativaRow, arquivoUrl?: string | null): Justificativa {
  return {
    id: row.id,
    userId: row.user_id,
    data: row.data,
    tipo: row.tipo,
    descricao: row.descricao,
    arquivoUrl: arquivoUrl ?? row.arquivo_path,
    minutosAbatidos: row.minutos_abatidos,
    createdAt: row.created_at,
    statusCompensacao: row.status_compensacao ?? undefined,
    gestorId: row.gestor_id,
    decididaEm: row.decidida_em,
    motivoRejeicao: row.motivo_rejeicao,
  }
}

export function mapBloqueio(row: BloqueioPresencaRow): BloqueioPresenca {
  return {
    id: row.id,
    userId: row.user_id,
    dataInicio: row.data_inicio,
    dataFim: row.data_fim,
    motivo: row.motivo,
    createdAt: row.created_at,
  }
}

export function mapNotificacao(
  row: NotificacaoRow,
  lida: boolean,
): Notificacao {
  return {
    id: row.id,
    userId: row.user_id,
    titulo: row.titulo,
    mensagem: row.mensagem,
    lida,
    createdAt: row.created_at,
  }
}

export function mapDesafio(row: DesafioSemanalRow): DesafioSemanal {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao,
    tipo: row.tipo,
    meta: row.meta,
    recompensa: row.recompensa,
    dataInicio: row.data_inicio,
    dataFim: row.data_fim,
    ativo: row.ativo,
    createdAt: row.created_at,
  }
}

export function mapDesafioProgresso(row: DesafioProgressoRow): DesafioProgresso {
  return {
    id: row.id,
    desafioId: row.desafio_id,
    userId: row.user_id,
    progressoAtual: row.progresso_atual,
    concluido: row.concluido,
    concluidoEm: row.concluido_em,
  }
}

export function mapPontoConfig(row: PontoConfigRow): PontoConfig {
  return {
    id: row.id,
    nome: row.nome,
    metaDiariaMinutos: row.meta_diaria_minutos,
    limiteMinutosSemJustificativa: row.limite_minutos_sem_justificativa,
    rejeitarMinutosZero: row.rejeitar_minutos_zero,
    formatoDecimal: row.formato_decimal,
    horarioEntradaEsperado: row.horario_entrada_esperado,
    ativo: row.ativo,
    padrao: row.padrao,
    createdAt: row.created_at,
  }
}

export function profileToInsert(user: Omit<User, 'id' | 'createdAt'>) {
  return {
    email: user.email,
    ra: user.ra,
    nome: user.nome,
    cargo: user.cargo,
    departamento: user.departamento,
    carga_horaria_semanal: user.cargaHorariaSemanal,
    data_inicio_recesso: user.dataInicioRecesso,
    data_fim_recesso: user.dataFimRecesso,
    gestor_id: user.gestorId ?? null,
  }
}

export function pontoToInsert(p: Omit<PontoRegistro, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    user_id: p.userId,
    data: p.data,
    entrada1: p.entrada1,
    saida1: p.saida1,
    entrada2: p.entrada2,
    saida2: p.saida2,
    total_minutos: p.totalMinutos,
    observacao: p.observacao,
    justificativa_hora_extra: p.justificativaHoraExtra,
  }
}
