-- Corrige falha "Database error creating new user" no Auth ao criar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cargo user_role := 'estagiario';
  v_carga int := 1800;
BEGIN
  IF NEW.raw_user_meta_data ? 'cargo' THEN
    BEGIN
      v_cargo := (NEW.raw_user_meta_data->>'cargo')::user_role;
    EXCEPTION WHEN OTHERS THEN
      v_cargo := 'estagiario';
    END;
  END IF;

  IF NEW.raw_user_meta_data ? 'carga_horaria_semanal' THEN
    BEGIN
      v_carga := (NEW.raw_user_meta_data->>'carga_horaria_semanal')::int;
    EXCEPTION WHEN OTHERS THEN
      v_carga := 1800;
    END;
  END IF;

  INSERT INTO public.profiles (
    id, email, ra, nome, cargo, departamento, carga_horaria_semanal
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'ra', 'N/A'),
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    v_cargo,
    COALESCE(NEW.raw_user_meta_data->>'departamento', ''),
    v_carga
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    ra = EXCLUDED.ra,
    nome = EXCLUDED.nome,
    cargo = EXCLUDED.cargo,
    departamento = EXCLUDED.departamento,
    carga_horaria_semanal = EXCLUDED.carga_horaria_semanal;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;
