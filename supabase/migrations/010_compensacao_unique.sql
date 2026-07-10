-- Remove compensações duplicadas (mantém o registro mais antigo por grupo)
DELETE FROM justificativas j
USING justificativas j2
WHERE j.id <> j2.id
  AND j.user_id = j2.user_id
  AND j.data = j2.data
  AND j.tipo = j2.tipo
  AND j.tipo IN ('compensacao', 'compensacao_parcial')
  AND j.status_compensacao IN ('pendente_gestor', 'aprovada_gestor')
  AND j2.status_compensacao IN ('pendente_gestor', 'aprovada_gestor')
  AND COALESCE(j.data_compensacao, '') = COALESCE(j2.data_compensacao, '')
  AND j.created_at > j2.created_at;

-- Impede novas duplicatas ativas por usuário/data
CREATE UNIQUE INDEX IF NOT EXISTS idx_justificativas_compensacao_integral_unica
  ON justificativas (user_id, data)
  WHERE tipo = 'compensacao'
    AND status_compensacao IN ('pendente_gestor', 'aprovada_gestor');

CREATE UNIQUE INDEX IF NOT EXISTS idx_justificativas_compensacao_parcial_unica
  ON justificativas (user_id, data, data_compensacao)
  WHERE tipo = 'compensacao_parcial'
    AND status_compensacao IN ('pendente_gestor', 'aprovada_gestor');
