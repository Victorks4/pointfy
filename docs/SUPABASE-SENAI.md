# Projeto Supabase PontFy (Senai CSI)

| Campo | Valor |
|-------|--------|
| Nome | PontFy |
| Project ref | `cnkhzfphbkswiasgalww` |
| URL | `https://cnkhzfphbkswiasgalww.supabase.co` |
| Região | us-east-2 |
| Dashboard | https://supabase.com/dashboard/project/cnkhzfphbkswiasgalww |

## Ambiente local

1. **Settings → API** no dashboard: copie **service_role** (secret) para `.env` / `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable ou anon)
   - `SUPABASE_SERVICE_ROLE_KEY`
2. `npm run db:check`
3. Bucket Storage: SQL Editor → rode `supabase/seed.sql` (bucket `justificativas`) se upload falhar.

## Migrations

Repo linkado: `npx supabase link --project-ref cnkhzfphbkswiasgalww`

Aplicar: `npx supabase db push`

## Auth (produção)

Defina `NEXT_PUBLIC_SITE_URL` (URL do app no Render ou domínio institucional). Após `npx supabase login`:

```bash
npm run supabase:auth-urls
```

(`SUPABASE_PROJECT_REF` default = Senai; ver `scripts/deploy/configure-supabase-auth-urls.mjs`)

## Hospedagem (Render)

Produção recomendada: [DEPLOY-RENDER.md](./DEPLOY-RENDER.md) + [`render.yaml`](../render.yaml).

Variáveis no Render: as 3 chaves Supabase + `NEXT_PUBLIC_SITE_URL` + `CRON_SECRET` (e-mail opcional).

```bash
npm run deploy:preflight
```

## Vercel (legado)

Se ainda usar Vercel temporariamente, atualize as variáveis Supabase e redeploy:

```bash
npm run vercel:env
```

Ver [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md).

### URLs sugeridas (Render + dev)

Enquanto o domínio institucional não existir, use o serviço Render (ex.: `https://pointfy.onrender.com`):

| Campo | Valor |
|-------|--------|
| **Site URL** | `https://pointfy.onrender.com` |
| **Redirect URLs** | `https://pointfy.onrender.com/auth/callback`, `https://pointfy.onrender.com/**`, `http://localhost:3000/**` |
| Paralelo Vercel (opcional) | `https://pointfy.vercel.app/auth/callback`, `https://pointfy.vercel.app/**` |

Comando após `npx supabase login` e `NEXT_PUBLIC_SITE_URL` no `.env.local`:

```powershell
$env:SUPABASE_EXTRA_REDIRECT_URLS="https://pointfy.vercel.app/auth/callback,https://pointfy.vercel.app/**"
npm run supabase:auth-urls
```


## Dados do projeto antigo (conta pessoal)

O PontFy Senai recebeu **schema** (migrations). Usuários e pontos **não** migram automaticamente — export/import conforme combinado (dump `public` + `auth` + Storage).

Projeto legado (referência): `royszemnvodpzhwswpmm` (Pontify).

## Migração de dados

Ver [MIGRACAO-DADOS.md](./MIGRACAO-DADOS.md) e scripts/db/export-legacy.ps1.
