# Backend Pointfy — Next.js + Supabase

## Visão geral

O backend roda no mesmo projeto Next.js 16. Dados persistem no **Supabase** (PostgreSQL + Auth + Storage). A UI continua usando `useAuth()` e `useData()`; por baixo, sessão e CRUD passam pelo Supabase.

## Onde ficam os “usuários” no Supabase?

Não existe tabela `usuarios`. O sistema usa **duas camadas**:

| Onde no dashboard | Tabela / área | O que guarda |
|-------------------|---------------|--------------|
| **Authentication → Users** | `auth.users` | Login (email/senha) |
| **Table Editor → profiles** | `profiles` | Nome, cargo, RA, gestor, etc. |

O login só funciona se existir registro **nos dois**: Auth + `profiles` com o mesmo `id`.

## Configuração local

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Copie `.env.example` → `.env` (ou `.env.local`) e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. No SQL Editor do Supabase, execute em ordem:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_fix_auth_user_trigger.sql` (se o seed falhar com "Database error")
   - `supabase/seed.sql` (bucket Storage)
4. Rode o seed de usuários demo:
   ```bash
   npm run db:seed
   ```
5. Confira se deu certo:
   ```bash
   npm run db:check
   ```
6. (Opcional) Testes unitários das regras críticas:
   ```bash
   npm test
   ```
7. Inicie o app:
   ```bash
   npm run dev
   ```

## Problemas comuns

### “Não loga” com admin@empresa.com / admin123

1. **Migrations não rodaram** — no Table Editor não aparece `profiles` → execute `001_initial_schema.sql` e `002_rls_policies.sql` no SQL Editor.
2. **Seed não rodou** — Authentication → Users vazio → rode `npm run db:seed`.
3. **Auth OK mas perfil falta** — existe em Authentication mas não em `profiles` → rode `npm run db:seed` de novo.
4. **URL errada no `.env`** — copie de **General → Project URL** (ex.: `https://xxxxx.supabase.co`).
5. **Chaves trocadas** — anon (publishable) ≠ service_role (secret).

### Email/password desabilitado

Em **Authentication → Providers → Email**, deixe **Enable Email** ligado.

### `Invalid path specified in request URL` (404)

Você colou a URL da **Data API** com `/rest/v1/` no `.env`.

**Errado:** `https://xxx.supabase.co/rest/v1/`  
**Certo:** `https://xxx.supabase.co` (Settings → **General** → Project URL)

### `ENOTFOUND` / `fetch failed` no `db:seed`

O domínio em `NEXT_PUBLIC_SUPABASE_URL` **não existe** (URL errada ou projeto apagado).

1. Dashboard Supabase → **Settings → General** → copie **Project URL** exata.
2. Substitua no `.env` — deve ser `https://ALGO.supabase.co` (o `ALGO` muda por projeto).
3. Teste no navegador: abrir essa URL deve responder (não dar “site não encontrado”).
4. Rode `npm run db:seed` de novo.

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
lib/validations/       # Schemas Zod + parseInput
lib/server/validators/ # Regras de negócio de ponto (servidor)
lib/types/action-result.ts  # Tipo { success, data | error } para Actions/UI
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

1. `DataProvider` (somente em `/dashboard`) chama `GET /api/v1/data` (bootstrap leve) e, em paralelo, `GET /api/v1/pontos` e `GET /api/v1/justificativas`.
2. Mutações (`addPonto`, `addUsuario`, …) disparam **Server Actions** em `app/actions/`.
3. Actions retornam `ActionResult` (`success` + `data` ou `error` em PT-BR).
4. Services validam com Zod (`parseInput`) e, no ponto, `ponto.validator.ts` (bloqueio, recesso, horários, limite, total).
5. Após sucesso, `refreshData()` recarrega bootstrap + domínios; a UI exibe `toast.error` quando `success: false`.

O bootstrap (`loadDashboardBootstrap`) carrega `profiles` por papel, notificações, bloqueios, desafios e configs. Pontos/justificativas usam janela de **180 dias** (limite 500 linhas para admin) e URLs de arquivo só sob demanda (`sign=1`).

**PostgREST / pooling:** o app usa apenas o SDK `@supabase/ssr` (sem `DATABASE_URL` / pooler 6543). Isso é o padrão para Supabase JS; pooling fica no lado Supabase. Só configure `SUPABASE_POOLED_URL` se migrar para SQL direto (Drizzle/Prisma).

Índices de performance: migration `003_performance_indexes.sql`. Validar no SQL Editor com `EXPLAIN (ANALYZE, BUFFERS)` nas queries de compensações e bloqueios.

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
| `/api/v1/data` | GET | Bootstrap (usuários, notificações, configs, desafios, bloqueios) — `no-store` |
| `/api/v1/pontos?from=&to=&userId=` | GET | Pontos por janela/cargo — `no-store` |
| `/api/v1/justificativas?rh=1&sign=1` | GET | Justificativas (`sign=1` gera URLs assinadas em lote) — `no-store` |
| `/api/v1/banco-horas?userId=&year=&month=` | GET | Saldo em minutos |

`ponto_configs` e `desafios_semanais` usam `unstable_cache` (TTL 5 min, tags `ponto-configs` / `desafios-semanais`).

## Segurança

- **RLS** em todas as tabelas — ver `002_rls_policies.sql`.
- `SUPABASE_SERVICE_ROLE_KEY` só no servidor (seed, criar usuário admin).
- Senhas demo removidas do código fonte; ficam só no Auth via seed.

## Deploy (Vercel)

Guia completo: [docs/DEPLOY-VERCEL.md](DEPLOY-VERCEL.md).

Resumo: configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` na Vercel; cadastre `https://SEU-DOMINIO.vercel.app/auth/callback` no Supabase; rode migrations e `npm run db:seed` uma vez se necessário.

```bash
npm run vercel:preflight
npx vercel --prod
```
