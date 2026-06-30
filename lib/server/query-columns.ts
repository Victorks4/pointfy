/** Colunas explícitas para reduzir payload PostgREST */

export const PROFILE_COLUMNS =
  'id,email,matricula,nome,cargo,departamento,carga_horaria_semanal,data_inicio_contrato,data_fim_contrato,data_inicio_recesso_1,data_fim_recesso_1,data_inicio_recesso_2,data_fim_recesso_2,must_change_password,gestor_id,created_at'

export const PONTO_COLUMNS =
  'id,user_id,data,entrada1,saida1,entrada2,saida2,total_minutos,observacao,justificativa_hora_extra,created_at,updated_at'

export const JUSTIFICATIVA_COLUMNS =
  'id,user_id,data,tipo,descricao,arquivo_path,minutos_abatidos,data_compensacao,minutos_solicitados,status_compensacao,gestor_id,decidida_em,motivo_rejeicao,created_at'

export const BLOQUEIO_COLUMNS = 'id,user_id,data_inicio,data_fim,motivo,created_at'

export const DESAFIO_COLUMNS =
  'id,titulo,descricao,tipo,meta,recompensa,data_inicio,data_fim,ativo,created_at'

export const DESAFIO_PROGRESSO_COLUMNS =
  'id,desafio_id,user_id,progresso_atual,concluido,concluido_em'

export const PONTO_CONFIG_COLUMNS =
  'id,nome,meta_diaria_minutos,limite_minutos_sem_justificativa,rejeitar_minutos_zero,formato_decimal,horario_entrada_esperado,ativo,padrao,created_at'

export const NOTIFICACAO_COLUMNS = 'id,user_id,titulo,mensagem,created_at'

export const FERIADO_COLUMNS = 'id,data,nome,tipo,recorrente,created_at'
