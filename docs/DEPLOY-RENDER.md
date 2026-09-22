# Deploy no Render — PontiFy (Supabase Senai)

Guia para hospedar o PontiFy (Next.js 16 + Supabase) no [Render](https://render.com), com banco no projeto **PontFy** (`cnkhzfphbkswiasgalww`).

> **Recomendado sem pagar:** [DEPLOY-RENDER-FREE.md](./DEPLOY-RENDER-FREE.md) — Web Service **Free**, sem Blueprint.  
> Env vars: [`scripts/deploy/render-web-free.env.example`](../scripts/deploy/render-web-free.env.example).

## Pré-requisitos

1. Repositório GitHub conectado ao Render
2. Chaves Supabase (Settings → API) com permissão de **Administrator** no projeto Senai, se possível
3. Migrations já aplicadas no Supabase (`npx supabase db push`)

## Checklist local

```bash
npm test
npm run build
npm run deploy:preflight
npm run db:check
```

## Opção A — Blueprint (`render.yaml`)

1. Render Dashboard → **New** → **Blueprint**
2. Conecte o repo `pointfy` — o Render lê [`render.yaml`](../render.yaml)
3. Crie o stack **pointfy** (Web Service) + **pointfy-hr-reminders** (Cron)
4. No Web Service, preencha **Environment** (valores secretos não vão no YAML):

| Variável | Obrigatória | Notas |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | `https://cnkhzfphbkswiasgalww.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | anon / publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | só servidor |
| `NEXT_PUBLIC_SITE_URL` | Sim | `https://pointfy.onrender.com` (ou URL real do serviço) |
| `CRON_SECRET` | Recomendado | token longo aleatório (mesmo valor no Cron Job) |
| `RESEND_API_KEY` / `SMTP_*` | Opcional | e-mail de atestados ao RH |

5. **Deploy** — aguarde build (`npm ci && npm run build`) e start (`npm start`)

## Opção B — Web Service manual

| Campo | Valor |
|-------|--------|
| Runtime | Node |
| Region | **Ohio** (próximo ao Supabase `us-east-2`) |
| Build | `npm ci && npm run build` |
| Start | `npm start` |
| Health check | `/` |
| Plan | **Starter** (evita sleep do free tier em horário de ponto) |

## Supabase — URLs de autenticação

Crítico para login e “esqueci senha”.

1. Defina `NEXT_PUBLIC_SITE_URL` no Render igual à URL pública (sem `/` no final).
2. Atualize o Supabase:

**Painel:** Authentication → URL Configuration → Site URL + Redirect URLs.

**CLI (com `npx supabase login`):**

```bash
# .env.local com NEXT_PUBLIC_SITE_URL=https://SEU-SERVICO.onrender.com
npm run supabase:auth-urls
```

Durante migração paralela com Vercel, mantenha redirects da Vercel:

```bash
# PowerShell
$env:SUPABASE_EXTRA_REDIRECT_URLS="https://pointfy.vercel.app/auth/callback,https://pointfy.vercel.app/**"
npm run supabase:auth-urls
```

## Cron — lembretes RH

A rota [`app/api/cron/hr-reminders/route.ts`](../app/api/cron/hr-reminders/route.ts) exige:

```http
GET /api/cron/hr-reminders
Authorization: Bearer <CRON_SECRET>
```

O [`render.yaml`](../render.yaml) define cron **11:00 UTC** (~08:00 horário de Brasília, sujeito a DST). Ajuste o `schedule` se necessário.

Teste manual:

```bash
curl -fsS -H "Authorization: Bearer SEU_CRON_SECRET" \
  "https://SEU-SERVICO.onrender.com/api/cron/hr-reminders"
```

Resposta esperada: `{"ok":true}`

## Testes de aceite (produção Render)

- [ ] Login estagiário, gestor e admin
- [ ] Dashboard carrega (sem loop em “Carregando dados…”)
- [ ] Registrar ponto
- [ ] Upload de justificativa (bucket `justificativas`)
- [ ] Esqueci senha → e-mail → `/auth/callback`
- [ ] Cron HR (curl acima)
- [ ] `node scripts/db/test-login.mjs` (com credenciais reais em `e2e/credentials.env`)

## Domínio customizado (Senai)

1. Render → Web Service → **Custom Domains** → CNAME
2. Atualize `NEXT_PUBLIC_SITE_URL` no Render → redeploy
3. `npm run supabase:auth-urls` com a nova URL

## Cutover a partir da Vercel

1. Valide todos os itens acima na URL Render.
2. Comunique a nova URL aos usuários.
3. Remova ou esvazie `crons` em [`vercel.json`](../vercel.json) e pause o projeto Vercel (ou reverta env para não apontar ao Senai).
4. Opcional: remova redirects Vercel do Supabase quando ninguém usar mais `pointfy.vercel.app`.

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| Login volta para `/` | Redirect URL não cadastrada | `supabase:auth-urls` + conferir `NEXT_PUBLIC_SITE_URL` |
| Primeiro acesso muito lento | Cold start (free) | Plano Starter |
| Cron 401 | `CRON_SECRET` diferente entre Web e Cron | Unificar no dashboard Render |
| Cron 500 | `CRON_SECRET` ausente no Web Service | Definir env no serviço web |
| Build falha | Node antigo | `NODE_VERSION=22` no Render |

## Segurança

- `SUPABASE_SERVICE_ROLE_KEY` apenas no Web Service (nunca `NEXT_PUBLIC_*`)
- Não commitar `.env`, `migrate.env` ou `senai-sync-passwords.sql`

## Referências

- Supabase Senai: [SUPABASE-SENAI.md](./SUPABASE-SENAI.md)
- Deploy legado Vercel: [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)
