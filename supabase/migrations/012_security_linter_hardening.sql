-- Hardening: move SECURITY DEFINER helpers to private schema (not exposed via PostgREST RPC)
-- Fixes Supabase linter: anon/authenticated RPC + search_path mutable warnings

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- ========== auth_user_role ==========
ALTER FUNCTION public.auth_user_role() SET SCHEMA private;

CREATE OR REPLACE FUNCTION private.auth_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cargo FROM profiles WHERE id = auth.uid();
$$;

-- ========== is_gestor_of_estagiario ==========
ALTER FUNCTION public.is_gestor_of_estagiario(uuid) SET SCHEMA private;

CREATE OR REPLACE FUNCTION private.is_gestor_of_estagiario(target_id UUID)
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

-- ========== auth_user_linked_gestor_ids ==========
ALTER FUNCTION public.auth_user_linked_gestor_ids() SET SCHEMA private;

CREATE OR REPLACE FUNCTION private.auth_user_linked_gestor_ids()
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

-- ========== set_updated_at (trigger) ==========
ALTER FUNCTION public.set_updated_at() SET SCHEMA private;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ponto_registros_updated_at ON ponto_registros;
CREATE TRIGGER ponto_registros_updated_at
  BEFORE UPDATE ON ponto_registros
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ========== handle_new_user (trigger) ==========
ALTER FUNCTION public.handle_new_user() SET SCHEMA private;

CREATE OR REPLACE FUNCTION private.handle_new_user()
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- ========== Remove unused function (dead code + RPC exposure) ==========
DROP FUNCTION IF EXISTS public.auth_user_gestor_id();

-- ========== Permissions: RLS needs EXECUTE for authenticated, not anon ==========
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, service_role;

-- ========== Policy with explicit private schema ==========
DROP POLICY IF EXISTS profiles_select_estagiario_linked_gestores ON profiles;
CREATE POLICY profiles_select_estagiario_linked_gestores ON profiles FOR SELECT
  USING (
    private.auth_user_role() = 'estagiario'
    AND id IN (SELECT private.auth_user_linked_gestor_ids())
  );

-- Policy gestor references is_gestor_of_estagiario — recreate with private schema
DROP POLICY IF EXISTS profiles_select_gestor ON profiles;
CREATE POLICY profiles_select_gestor ON profiles FOR SELECT
  USING (
    private.auth_user_role() = 'gestor'
    AND (
      id = auth.uid()
      OR gestor_id = auth.uid()
      OR private.is_gestor_of_estagiario(id)
    )
  );
