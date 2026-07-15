-- Estagiário pode ler perfis dos gestores vinculados (para relatório PDF e exibição no app)

CREATE POLICY profiles_select_estagiario_linked_gestores ON profiles FOR SELECT
  USING (
    auth_user_role() = 'estagiario'
    AND (
      id IN (
        SELECT gestor_id FROM profiles
        WHERE id = auth.uid() AND gestor_id IS NOT NULL
      )
      OR id IN (
        SELECT gestor_id FROM estagiario_gestores
        WHERE estagiario_id = auth.uid()
      )
    )
  );
