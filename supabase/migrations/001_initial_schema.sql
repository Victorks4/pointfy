-- Pointfy: schema inicial

CREATE TYPE user_role AS ENUM ('estagiario', 'admin', 'gestor');
CREATE TYPE justificativa_tipo AS ENUM ('atestado', 'compensacao');
CREATE TYPE status_compensacao AS ENUM (
  'pendente_gestor',
  'aprovada_gestor',
  'rejeitada_gestor'
);
CREATE TYPE tipo_desafio AS ENUM ('meta_horas', 'streak', 'pontualidade', 'custom');
CREATE TYPE formato_decimal AS ENUM ('americano', 'brasileiro');

-- Perfis (espelha User; id = auth.users.id)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  ra TEXT NOT NULL,
  nome TEXT NOT NULL,
  cargo user_role NOT NULL DEFAULT 'estagiario',
  departamento TEXT NOT NULL DEFAULT '',
  carga_horaria_semanal INT NOT NULL DEFAULT 1800,
  data_inicio_recesso DATE,
  data_fim_recesso DATE,
  gestor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_gestor ON profiles(gestor_id);
CREATE INDEX idx_profiles_cargo ON profiles(cargo);

-- Registros de ponto
CREATE TABLE ponto_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  entrada1 TEXT,
  saida1 TEXT,
  entrada2 TEXT,
  saida2 TEXT,
  total_minutos INT NOT NULL DEFAULT 0,
  observacao TEXT,
  justificativa_hora_extra TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, data)
);

CREATE INDEX idx_ponto_user_data ON ponto_registros(user_id, data DESC);

-- Justificativas
CREATE TABLE justificativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo justificativa_tipo NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  arquivo_path TEXT,
  minutos_abatidos INT NOT NULL DEFAULT 0,
  status_compensacao status_compensacao,
  gestor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decidida_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_justificativas_user ON justificativas(user_id, data DESC);

-- Bloqueios de presença
CREATE TABLE bloqueios_presenca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notificações
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_user ON notificacoes(user_id, created_at DESC);

-- Leituras de notificação (broadcast user_id null)
CREATE TABLE notificacao_leituras (
  notificacao_id UUID NOT NULL REFERENCES notificacoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lida_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notificacao_id, user_id)
);

-- Desafios semanais
CREATE TABLE desafios_semanais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  tipo tipo_desafio NOT NULL DEFAULT 'custom',
  meta INT NOT NULL DEFAULT 0,
  recompensa TEXT NOT NULL DEFAULT '',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE desafio_progressos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  desafio_id UUID NOT NULL REFERENCES desafios_semanais(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progresso_atual INT NOT NULL DEFAULT 0,
  concluido BOOLEAN NOT NULL DEFAULT FALSE,
  concluido_em TIMESTAMPTZ,
  UNIQUE (desafio_id, user_id)
);

-- Configurações de ponto
CREATE TABLE ponto_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  meta_diaria_minutos INT NOT NULL DEFAULT 360,
  limite_minutos_sem_justificativa INT NOT NULL DEFAULT 370,
  rejeitar_minutos_zero BOOLEAN NOT NULL DEFAULT TRUE,
  formato_decimal formato_decimal NOT NULL DEFAULT 'americano',
  horario_entrada_esperado TEXT NOT NULL DEFAULT '09:00',
  ativo BOOLEAN NOT NULL DEFAULT FALSE,
  padrao BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: atualizar updated_at em ponto_registros
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ponto_registros_updated_at
  BEFORE UPDATE ON ponto_registros
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Função auxiliar: cargo do usuário autenticado
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT cargo FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_gestor_id()
RETURNS UUID AS $$
  SELECT gestor_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Auto-criar profile ao registrar no Auth (opcional; seed usa insert manual)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, ra, nome, cargo, departamento)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'ra', 'N/A'),
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'cargo')::user_role, 'estagiario'),
    COALESCE(NEW.raw_user_meta_data->>'departamento', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Config padrão
INSERT INTO ponto_configs (
  nome, meta_diaria_minutos, limite_minutos_sem_justificativa,
  rejeitar_minutos_zero, formato_decimal, horario_entrada_esperado,
  ativo, padrao
) VALUES (
  'Padrão (6h/dia)', 360, 370, TRUE, 'americano', '09:00', TRUE, TRUE
);

-- Notificação de boas-vindas (broadcast)
INSERT INTO notificacoes (user_id, titulo, mensagem)
VALUES (
  NULL,
  'Bem-vindo ao sistema de presença',
  'Lembre-se de registrar sua presença diariamente. Horários devem ser informados no formato HH:mm (ex: 08:15).'
);
