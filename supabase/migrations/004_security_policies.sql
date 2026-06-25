-- Security hardening: RLS policies + signup trigger

-- ========== BLOQUEIOS ==========
DROP POLICY IF EXISTS bloqueios_select_all_auth ON bloqueios_presenca;

CREATE POLICY bloqueios_select_own ON bloqueios_presenca FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY bloqueios_select_gestor_team ON bloqueios_presenca FOR SELECT
  USING (
    auth_user_role() = 'gestor'
    AND user_id IN (SELECT id FROM profiles WHERE gestor_id = auth.uid())
  );

CREATE POLICY bloqueios_select_admin ON bloqueios_presenca FOR SELECT
  USING (auth_user_role() = 'admin');

-- ========== NOTIFICACOES ==========
DROP POLICY IF EXISTS notificacoes_insert_system ON notificacoes;

CREATE POLICY notificacoes_insert_scoped ON notificacoes FOR INSERT
  WITH CHECK (
    auth_user_role() = 'admin'
    OR user_id = auth.uid()
    OR (
      auth_user_role() = 'gestor'
      AND user_id IN (SELECT id FROM profiles WHERE gestor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS notificacoes_select ON notificacoes;

CREATE POLICY notificacoes_select ON notificacoes FOR SELECT
  USING (
    user_id IS NULL
    OR user_id = auth.uid()
    OR auth_user_role() = 'admin'
    OR (
      auth_user_role() = 'gestor'
      AND user_id IN (SELECT id FROM profiles WHERE gestor_id = auth.uid())
    )
  );

-- ========== DESAFIO PROGRESSOS ==========
DROP POLICY IF EXISTS progresso_select ON desafio_progressos;

CREATE POLICY progresso_select ON desafio_progressos FOR SELECT
  USING (
    user_id = auth.uid()
    OR auth_user_role() = 'admin'
    OR (
      auth_user_role() = 'gestor'
      AND user_id IN (SELECT id FROM profiles WHERE gestor_id = auth.uid())
    )
  );

-- ========== SIGNUP: força cargo estagiario ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    ra,
    nome,
    cargo,
    departamento,
    carga_horaria_semanal
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'ra', ''),
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'estagiario',
    COALESCE(NEW.raw_user_meta_data->>'departamento', ''),
    COALESCE((NEW.raw_user_meta_data->>'carga_horaria_semanal')::int, 1800)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
