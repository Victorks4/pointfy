-- Row Level Security

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponto_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE justificativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueios_presenca ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacao_leituras ENABLE ROW LEVEL SECURITY;
ALTER TABLE desafios_semanais ENABLE ROW LEVEL SECURITY;
ALTER TABLE desafio_progressos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponto_configs ENABLE ROW LEVEL SECURITY;

-- ========== PROFILES ==========
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (id = auth.uid() OR auth_user_role() = 'admin');

CREATE POLICY profiles_select_gestor_team ON profiles FOR SELECT
  USING (
    auth_user_role() = 'gestor'
    AND (id = auth.uid() OR gestor_id = auth.uid())
  );

CREATE POLICY profiles_select_estagiario_gestor ON profiles FOR SELECT
  USING (
    auth_user_role() = 'estagiario'
    AND id = auth.uid()
  );

CREATE POLICY profiles_admin_all ON profiles FOR ALL
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ========== PONTO_REGISTROS ==========
CREATE POLICY pontos_select_own ON ponto_registros FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY pontos_select_gestor ON ponto_registros FOR SELECT
  USING (
    auth_user_role() = 'gestor'
    AND user_id IN (SELECT id FROM profiles WHERE gestor_id = auth.uid())
  );

CREATE POLICY pontos_select_admin ON ponto_registros FOR SELECT
  USING (auth_user_role() = 'admin');

CREATE POLICY pontos_insert_own ON ponto_registros FOR INSERT
  WITH CHECK (user_id = auth.uid() AND auth_user_role() = 'estagiario');

CREATE POLICY pontos_update_own ON ponto_registros FOR UPDATE
  USING (user_id = auth.uid() AND auth_user_role() = 'estagiario')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY pontos_admin_all ON ponto_registros FOR ALL
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ========== JUSTIFICATIVAS ==========
CREATE POLICY justificativas_select_own ON justificativas FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY justificativas_select_gestor ON justificativas FOR SELECT
  USING (
    auth_user_role() = 'gestor'
    AND (
      user_id IN (SELECT id FROM profiles WHERE gestor_id = auth.uid())
      OR gestor_id = auth.uid()
    )
  );

CREATE POLICY justificativas_select_admin ON justificativas FOR SELECT
  USING (auth_user_role() = 'admin');

CREATE POLICY justificativas_insert_own ON justificativas FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY justificativas_update_gestor ON justificativas FOR UPDATE
  USING (
    auth_user_role() = 'gestor'
    AND tipo = 'compensacao'
    AND user_id IN (SELECT id FROM profiles WHERE gestor_id = auth.uid())
  );

CREATE POLICY justificativas_admin_all ON justificativas FOR ALL
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ========== BLOQUEIOS ==========
CREATE POLICY bloqueios_select_all_auth ON bloqueios_presenca FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY bloqueios_admin_write ON bloqueios_presenca FOR ALL
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ========== NOTIFICACOES ==========
CREATE POLICY notificacoes_select ON notificacoes FOR SELECT
  USING (
    user_id IS NULL
    OR user_id = auth.uid()
    OR auth_user_role() IN ('admin', 'gestor')
  );

CREATE POLICY notificacoes_insert_admin ON notificacoes FOR INSERT
  WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY notificacoes_insert_system ON notificacoes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ========== NOTIFICACAO_LEITURAS ==========
CREATE POLICY leituras_own ON notificacao_leituras FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ========== DESAFIOS ==========
CREATE POLICY desafios_select ON desafios_semanais FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY desafios_admin ON desafios_semanais FOR ALL
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY progresso_select ON desafio_progressos FOR SELECT
  USING (
    user_id = auth.uid()
    OR auth_user_role() IN ('admin', 'gestor')
  );

CREATE POLICY progresso_upsert_own ON desafio_progressos FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY progresso_admin ON desafio_progressos FOR ALL
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ========== PONTO_CONFIGS ==========
CREATE POLICY configs_select ON ponto_configs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY configs_admin ON ponto_configs FOR ALL
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- ========== STORAGE (executar no dashboard ou migration separada) ==========
-- Bucket: justificativas (criar via seed ou Supabase CLI)
