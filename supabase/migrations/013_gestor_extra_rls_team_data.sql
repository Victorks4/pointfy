-- Alinha RLS de dados da equipe com multi-gestor (estagiario_gestores + gestor principal).
-- Antes: varias policies so consideravam profiles.gestor_id = auth.uid().

-- ========== PONTO_REGISTROS ==========
DROP POLICY IF EXISTS pontos_select_gestor ON ponto_registros;
CREATE POLICY pontos_select_gestor ON ponto_registros FOR SELECT
  USING (
    private.auth_user_role() = 'gestor'
    AND private.is_gestor_of_estagiario(user_id)
  );

-- ========== BLOQUEIOS_PRESENCA ==========
DROP POLICY IF EXISTS bloqueios_select_gestor_team ON bloqueios_presenca;
CREATE POLICY bloqueios_select_gestor_team ON bloqueios_presenca FOR SELECT
  USING (
    private.auth_user_role() = 'gestor'
    AND private.is_gestor_of_estagiario(user_id)
  );

-- ========== DESAFIO_PROGRESSOS ==========
DROP POLICY IF EXISTS progresso_select ON desafio_progressos;
CREATE POLICY progresso_select ON desafio_progressos FOR SELECT
  USING (
    user_id = auth.uid()
    OR private.auth_user_role() = 'admin'
    OR (
      private.auth_user_role() = 'gestor'
      AND private.is_gestor_of_estagiario(user_id)
    )
  );

-- ========== NOTIFICACOES ==========
DROP POLICY IF EXISTS notificacoes_insert_scoped ON notificacoes;
CREATE POLICY notificacoes_insert_scoped ON notificacoes FOR INSERT
  WITH CHECK (
    private.auth_user_role() = 'admin'
    OR user_id = auth.uid()
    OR (
      private.auth_user_role() = 'gestor'
      AND user_id IS NOT NULL
      AND private.is_gestor_of_estagiario(user_id)
    )
  );

DROP POLICY IF EXISTS notificacoes_select ON notificacoes;
CREATE POLICY notificacoes_select ON notificacoes FOR SELECT
  USING (
    user_id IS NULL
    OR user_id = auth.uid()
    OR private.auth_user_role() = 'admin'
    OR (
      private.auth_user_role() = 'gestor'
      AND user_id IS NOT NULL
      AND private.is_gestor_of_estagiario(user_id)
    )
  );

-- ========== JUSTIFICATIVAS ==========
DROP POLICY IF EXISTS justificativas_select_gestor ON justificativas;
CREATE POLICY justificativas_select_gestor ON justificativas FOR SELECT
  USING (
    private.auth_user_role() = 'gestor'
    AND (
      private.is_gestor_of_estagiario(user_id)
      OR gestor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS justificativas_update_gestor ON justificativas;
CREATE POLICY justificativas_update_gestor ON justificativas FOR UPDATE
  USING (
    private.auth_user_role() = 'gestor'
    AND tipo = 'compensacao'
    AND private.is_gestor_of_estagiario(user_id)
  );
