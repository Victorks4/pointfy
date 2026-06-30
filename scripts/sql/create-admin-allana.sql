-- Admin: allanasantiago@fieb.com | senha inicial: 1234567
-- Cole no SQL Editor do Supabase (Dashboard → SQL → New query → Run)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email text := 'allanasantiago@fieb.com';
  v_password text := '1234567';
  v_user_id uuid;
  v_new_id uuid := gen_random_uuid();
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
  UPDATE public.profiles SET
    cargo = 'admin',
    nome = 'Allana Santiago',
    matricula = CASE WHEN matricula IS NULL OR matricula = '' THEN 'ADM002' ELSE matricula END,
    departamento = 'RH',
    carga_horaria_semanal = 2400,
    must_change_password = false,
    gestor_id = NULL
  WHERE id = v_user_id;

  UPDATE auth.users SET
    encrypted_password = crypt(v_password, gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE 'Usuário já existia — perfil atualizado para admin e senha redefinida.';
  RETURN;
  END IF;

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_new_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'matricula', 'ADM002',
      'nome', 'Allana Santiago',
      'cargo', 'admin',
      'departamento', 'RH',
      'carga_horaria_semanal', 2400
    ),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_new_id,
    v_new_id::text,
    jsonb_build_object(
      'sub', v_new_id::text,
      'email', v_email,
      'email_verified', true,
      'provider', 'email'
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  INSERT INTO public.profiles (
    id,
    email,
    matricula,
    nome,
    cargo,
    departamento,
    carga_horaria_semanal,
    must_change_password
  ) VALUES (
    v_new_id,
    v_email,
    'ADM002',
    'Allana Santiago',
    'admin',
    'RH',
    2400,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    cargo = 'admin',
    matricula = EXCLUDED.matricula,
    nome = EXCLUDED.nome,
    departamento = EXCLUDED.departamento,
    carga_horaria_semanal = EXCLUDED.carga_horaria_semanal,
    must_change_password = false;

  RAISE NOTICE 'Admin criado: % / senha: %', v_email, v_password;
END $$;
