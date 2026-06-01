-- Índices de performance (auditoria Pontify)

CREATE INDEX IF NOT EXISTS idx_justificativas_tipo_status_created
  ON justificativas (tipo, status_compensacao, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_justificativas_gestor_compensacao
  ON justificativas (gestor_id)
  WHERE tipo = 'compensacao';

CREATE INDEX IF NOT EXISTS idx_bloqueios_user_periodo
  ON bloqueios_presenca (user_id, data_inicio, data_fim);

CREATE INDEX IF NOT EXISTS idx_desafio_progressos_user
  ON desafio_progressos (user_id);

CREATE INDEX IF NOT EXISTS idx_desafios_semanais_ativo_periodo
  ON desafios_semanais (ativo, data_inicio, data_fim);
