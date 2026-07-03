-- Jornada de trabalho prevista por estagiário (entrada, pausa e saída)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS horario_trabalho_entrada_1 TEXT,
  ADD COLUMN IF NOT EXISTS horario_trabalho_saida_1 TEXT,
  ADD COLUMN IF NOT EXISTS horario_trabalho_entrada_2 TEXT,
  ADD COLUMN IF NOT EXISTS horario_trabalho_saida_2 TEXT;

COMMENT ON COLUMN profiles.horario_trabalho_entrada_1 IS 'Horário previsto de entrada (HH:mm)';
COMMENT ON COLUMN profiles.horario_trabalho_saida_1 IS 'Horário previsto de saída para intervalo (HH:mm)';
COMMENT ON COLUMN profiles.horario_trabalho_entrada_2 IS 'Horário previsto de retorno do intervalo (HH:mm)';
COMMENT ON COLUMN profiles.horario_trabalho_saida_2 IS 'Horário previsto de saída (HH:mm)';
