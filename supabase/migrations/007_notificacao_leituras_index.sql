-- Índice para leituras de notificações por usuário
CREATE INDEX IF NOT EXISTS idx_notificacao_leituras_user_id
  ON notificacao_leituras (user_id);
