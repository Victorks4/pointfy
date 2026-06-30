-- Gestor vê equipe via estagiario_gestores (além de gestor_id legado)

CREATE OR REPLACE FUNCTION public.is_gestor_of_estagiario(target_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM estagiario_gestores
    WHERE estagiario_id = target_id AND gestor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = target_id AND gestor_id = auth.uid()
  );
$$;

-- Atualizar policy de profiles select para gestor (se existir)
DROP POLICY IF EXISTS profiles_select_gestor ON profiles;
CREATE POLICY profiles_select_gestor ON profiles FOR SELECT
  USING (
    auth_user_role() = 'gestor'
    AND (
      id = auth.uid()
      OR gestor_id = auth.uid()
      OR public.is_gestor_of_estagiario(id)
    )
  );
