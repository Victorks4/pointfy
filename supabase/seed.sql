-- Seed demo: execute APÓS criar usuários no Auth (script npm run db:seed)
-- Ou use o script Node em scripts/seed-demo-users.mjs com service_role

-- IDs fixos para referência em desenvolvimento (substituir pelos UUIDs reais do Auth após seed script)
-- O script seed-demo-users.mjs cria auth users e profiles com gestor vinculado.

-- Notificação inicial já inserida em 001_initial_schema.sql

-- Storage bucket (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('justificativas', 'justificativas', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "justificativas_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'justificativas'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "justificativas_read_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'justificativas'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "justificativas_read_gestor"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'justificativas'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.cargo = 'gestor'
      AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM profiles WHERE gestor_id = auth.uid()
      )
  )
);

CREATE POLICY "justificativas_read_admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'justificativas'
  AND auth_user_role() = 'admin'
);
