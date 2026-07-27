# Deploy na Vercel — Pontify

Guia para hospedar o Pontify (Next.js 16 + Supabase) na Vercel.

## Pré-requisitos

1. Repositório no GitHub: `Victorks4/pointfy`
2. Projeto Supabase com migrations aplicadas (`001`, `002`, `003_*`)
3. Conta Vercel com acesso ao time `victorks4s-projects`

## Checklist antes do deploy

```bash
npm test
npm run build
npm run db:check   # valida URL/keys do Supabase localmente
```

## Variáveis de ambiente (Vercel)

Em **Project → Settings → Environment Variables**, configure para **Production**, **Preview** e **Development**:

| Variável | Onde obter | Expor no client? |
|----------|------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → General → Project URL (sem `/rest/v1`) | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | **Não** (só servidor) |
| `NEXT_PUBLIC_SITE_URL` | URL pública do app (ex.: `https://pointfy.vercel.app`) | Sim |
| `RESEND_API_KEY` | [Resend](https://resend.com) → API Keys (opcional, e-mail) | **Não** |
| `EMAIL_FROM` | Remetente verificado no Resend (ex.: `Pontify <noreply@dominio.com>`) | **Não** |

Copie de `.env.example`. **Nunca** commite `.env`, `.env.local` ou `docs/DADOS-API.md` (notas locais de credenciais).

### Via CLI (a partir da máquina com `.env` local)

```bash
npx vercel link
npx vercel env pull .env.vercel.local
# Para enviar do .env local (cuidado com secrets no terminal):
# npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

## Supabase — URLs de autenticação

No painel Supabase → **Authentication → URL Configuration**:

| Campo | Valor |
|-------|--------|
| **Site URL** | `https://pointfy.vercel.app` |
| **Redirect URLs** | `https://pointfy.vercel.app/auth/callback` |
| | `https://pointfy.vercel.app/**` |
| | `http://localhost:3000/auth/callback` (dev) |

Sem isso, login OAuth/magic link e refresh de sessão podem falhar em produção.

## Storage

Bucket `justificativas` deve existir com policies RLS de upload/leitura para usuários autenticados.

## Deploy

### Opção A — Git (recomendado)

1. [vercel.com/new](https://vercel.com/new) → Import `Victorks4/pointfy`
2. Framework: **Next.js** (detectado automaticamente)
3. Adicione as 3 variáveis de ambiente
4. Deploy

Cada push em `main` gera deploy de produção.

### Opção B — CLI

```bash
npx vercel link
npx vercel --prod
```

O arquivo `vercel.json` define região **gru1** (São Paulo) para menor latência no Brasil.

## Pós-deploy

1. Abra a URL de produção e teste login (estagiário, gestor, admin)
2. Confira **Vercel → Speed Insights** / Web Vitals (já instrumentado)
3. Rode seed **uma vez** se necessário (local, com service role):

   ```bash
   npm run db:seed
   ```

4. Aplique migrations pendentes no SQL Editor do Supabase de produção

## O que já está pronto no código

- `@vercel/analytics` no `app/layout.tsx`
- `WebVitalsReporter` para métricas
- API routes com `force-dynamic` e `no-store` (dados pessoais)
- Middleware de sessão Supabase (`middleware.ts`)
- Imagens otimizadas (`next.config.mjs`: AVIF/WebP)
- Build de produção validado (`npm run build`)

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| Login volta para `/` sem entrar | Redirect URL não cadastrada no Supabase | Ajustar URL Configuration |
| `NEXT_PUBLIC_SUPABASE_URL não definida` | Env ausente na Vercel | Revisar variáveis e redeploy |
| Dashboard vazio / 401 | Cookies bloqueados ou anon key errada | Conferir keys e domínio |
| Upload de justificativa falha | Bucket ou policy Storage | Criar bucket `justificativas` |
| Build OK, runtime 500 | Migration não aplicada | Rodar SQL em produção |

## Segurança

- `SUPABASE_SERVICE_ROLE_KEY` apenas em env de **servidor** na Vercel (nunca `NEXT_PUBLIC_*`)
- RLS ativo em todas as tabelas — não desabilitar em produção
- Não usar `DATABASE_URL` direto; app usa PostgREST via SDK (ver `docs/BACKEND.md`)
