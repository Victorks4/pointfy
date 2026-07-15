-- Corrige policy de leitura de gestores: evita subquery em profiles sob RLS (pode bloquear login).

CREATE OR REPLACE FUNCTION public.auth_user_linked_gestor_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gestor_id FROM profiles
  WHERE id = auth.uid() AND gestor_id IS NOT NULL
  UNION
  SELECT gestor_id FROM estagiario_gestores
  WHERE estagiario_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.auth_user_linked_gestor_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_linked_gestor_ids() TO authenticated;

DROP POLICY IF EXISTS profiles_select_estagiario_linked_gestores ON profiles;

CREATE POLICY profiles_select_estagiario_linked_gestores ON profiles FOR SELECT
  USING (
    auth_user_role() = 'estagiario'
    AND id IN (SELECT public.auth_user_linked_gestor_ids())
  );
