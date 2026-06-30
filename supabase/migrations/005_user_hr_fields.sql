-- HR fields: matricula, contrato, 2 recessos, senha, feriados, multi-gestor, compensacao parcial

-- ========== PROFILES ==========
ALTER TABLE profiles RENAME COLUMN ra TO matricula;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS data_inicio_contrato DATE,
  ADD COLUMN IF NOT EXISTS data_fim_contrato DATE,
  ADD COLUMN IF NOT EXISTS data_inicio_recesso_1 DATE,
  ADD COLUMN IF NOT EXISTS data_fim_recesso_1 DATE,
  ADD COLUMN IF NOT EXISTS data_inicio_recesso_2 DATE,
  ADD COLUMN IF NOT EXISTS data_fim_recesso_2 DATE,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;

-- Migrar recesso legado para recesso 1
UPDATE profiles
SET
  data_inicio_recesso_1 = data_inicio_recesso,
  data_fim_recesso_1 = data_fim_recesso
WHERE data_inicio_recesso IS NOT NULL;

ALTER TABLE profiles
  DROP COLUMN IF EXISTS data_inicio_recesso,
  DROP COLUMN IF EXISTS data_fim_recesso;

-- ========== MULTI-GESTOR ==========
CREATE TABLE IF NOT EXISTS estagiario_gestores (
  estagiario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gestor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (estagiario_id, gestor_id),
  CHECK (estagiario_id <> gestor_id)
);

CREATE INDEX IF NOT EXISTS idx_estagiario_gestores_gestor ON estagiario_gestores(gestor_id);

-- Popular junction a partir do gestor principal
INSERT INTO estagiario_gestores (estagiario_id, gestor_id)
SELECT id, gestor_id FROM profiles
WHERE cargo = 'estagiario' AND gestor_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ========== FERIADOS ==========
CREATE TYPE feriado_tipo AS ENUM ('nacional', 'municipal', 'empresa');

CREATE TABLE IF NOT EXISTS feriados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo feriado_tipo NOT NULL DEFAULT 'empresa',
  recorrente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feriados_data ON feriados(data);

-- Feriados nacionais fixos 2026 (exemplo seed)
INSERT INTO feriados (data, nome, tipo, recorrente) VALUES
  ('2026-01-01', 'Confraternização Universal', 'nacional', true),
  ('2026-04-21', 'Tiradentes', 'nacional', true),
  ('2026-05-01', 'Dia do Trabalho', 'nacional', true),
  ('2026-09-07', 'Independência do Brasil', 'nacional', true),
  ('2026-10-12', 'Nossa Senhora Aparecida', 'nacional', true),
  ('2026-11-02', 'Finados', 'nacional', true),
  ('2026-11-15', 'Proclamação da República', 'nacional', true),
  ('2026-11-20', 'Consciência Negra', 'nacional', true),
  ('2026-12-25', 'Natal', 'nacional', true)
ON CONFLICT (data) DO NOTHING;

-- ========== JUSTIFICATIVAS: compensação parcial ==========
ALTER TYPE justificativa_tipo ADD VALUE IF NOT EXISTS 'compensacao_parcial';

ALTER TABLE justificativas
  ADD COLUMN IF NOT EXISTS data_compensacao DATE,
  ADD COLUMN IF NOT EXISTS minutos_solicitados INT;

-- ========== TRIGGER handle_new_user (matricula) ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, matricula, nome, cargo, departamento, carga_horaria_semanal, must_change_password
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'matricula', NEW.raw_user_meta_data->>'ra', ''),
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'estagiario',
    COALESCE(NEW.raw_user_meta_data->>'departamento', ''),
    COALESCE((NEW.raw_user_meta_data->>'carga_horaria_semanal')::int, 1800),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ========== RLS estagiario_gestores ==========
ALTER TABLE estagiario_gestores ENABLE ROW LEVEL SECURITY;

CREATE POLICY estagiario_gestores_select ON estagiario_gestores FOR SELECT
  USING (
    auth_user_role() = 'admin'
    OR gestor_id = auth.uid()
    OR estagiario_id = auth.uid()
  );

CREATE POLICY estagiario_gestores_admin_write ON estagiario_gestores FOR ALL
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ========== RLS feriados ==========
ALTER TABLE feriados ENABLE ROW LEVEL SECURITY;

CREATE POLICY feriados_select_auth ON feriados FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY feriados_admin_write ON feriados FOR ALL
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');
