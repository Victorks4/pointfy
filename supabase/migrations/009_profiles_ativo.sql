-- Status ativo/inativo do perfil (soft-disable sem deletar usuario)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_ativo ON profiles (ativo) WHERE ativo = true;
