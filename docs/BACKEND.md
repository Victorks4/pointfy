# Backend Pointfy — Next.js + Supabase

## Visão geral

O backend roda no mesmo projeto Next.js 16. Dados persistem no **Supabase** (PostgreSQL + Auth + Storage). A UI continua usando `useAuth()` e `useData()`; por baixo, sessão e CRUD passam pelo Supabase.

## Configuração local

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Copie `.env.example` → `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. No SQL Editor do Supabase, execute em ordem:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/seed.sql` (bucket Storage)
4. Rode o seed de usuários demo:
   ```bash
   npm run db:seed
   ```
5. Inicie o app:
   ```bash
   npm run dev
   ```

### Logins demo

| Email | Senha | Papel |
|-------|-------|-------|
| admin@empresa.com | admin123 | admin |
| gestor@empresa.com | gestor123 | gestor |
| estagiario@empresa.com | est123 | estagiário |

## Estrutura criada

```
lib/supabase/          # Clientes browser, server, admin, middleware
lib/server/
  auth.ts              # getSessionUser, requireRole
  banco-horas.ts       # Cálculo extraído do data-context
  db-types.ts          # Tipos das tabelas
  mappers.ts           # DB row ↔ tipos de domínio
  services/            # Regras por agregado
lib/validations/       # Schemas Zod
app/actions/           # Server Actions (mutações)
app/api/v1/            # GET snapshot e banco de horas
middleware.ts          # Refresh de sessão + proteção /dashboard
supabase/migrations/   # Schema + RLS
scripts/seed-demo-users.mjs
```

## Fluxo de autenticação

1. Login chama `supabase.auth.signInWithPassword` em `lib/auth-context.tsx`.
2. `middleware.ts` renova cookies e bloqueia `/dashboard` sem sessão.
3. Perfil carregado da tabela `profiles` (cargo, gestor, etc.).

## Fluxo de dados

1. `DataProvider` chama `GET /api/v1/data` ao montar (usuário logado).
2. Mutações (`addPonto`, `addUsuario`, …) disparam **Server Actions** em `app/actions/`.
3. Actions delegam para `lib/server/services/*` com cliente Supabase do servidor (RLS aplicada).
4. Após mutação, `refreshData()` recarrega o snapshot.

## Tabelas principais

| Tabela | Uso |
|--------|-----|
| `profiles` | Usuários (ligado a `auth.users`) |
| `ponto_registros` | Presença diária (unique user+data) |
| `justificativas` | Atestado / compensação |
| `bloqueios_presenca` | Admin bloqueia registro |
| `notificacoes` + `notificacao_leituras` | Avisos e leitura de broadcast |
| `desafios_semanais` / `desafio_progressos` | Gamificação |
| `ponto_configs` | Meta diária, limites |

## Storage

Bucket `justificativas`: upload via `uploadJustificativaArquivoAction` em `app/actions/justificativas.ts`. Path: `{userId}/{timestamp}.ext`.

## API

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/v1/data` | GET | Snapshot completo para o dashboard |
| `/api/v1/banco-horas?userId=&year=&month=` | GET | Saldo em minutos |

## Segurança

- **RLS** em todas as tabelas — ver `002_rls_policies.sql`.
- `SUPABASE_SERVICE_ROLE_KEY` só no servidor (seed, criar usuário admin).
- Senhas demo removidas do código fonte; ficam só no Auth via seed.

## Deploy (Vercel)

Configure as mesmas variáveis de ambiente no painel da Vercel. Rode migrations no Supabase de produção e `npm run db:seed` uma vez (ou crie usuários manualmente).
