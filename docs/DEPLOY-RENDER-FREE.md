# Deploy no Render — Web Service **Free**

Guia rápido para subir o PontiFy **sem Blueprint** (sem cobrança obrigatória do plano Starter). O app funciona no tier gratuito; o serviço **dorme** após ~15 min sem acesso e o primeiro acesso do dia pode levar ~30–60 s.

Banco: Supabase Senai `cnkhzfphbkswiasgalww`.

---

## 1. Criar o Web Service

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
2. Conecte **GitHub** → repositório **Victorks4/pointfy**
3. Preencha:

| Campo | Valor |
|--------|--------|
| **Name** | `pointfy` (define a URL `https://<name>.onrender.com`) |
| **Region** | **Ohio (US East)** |
| **Branch** | `main` |
| **Runtime** | **Node** |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

4. **Health Check Path** (Advanced): `/`

---

## 2. Variáveis de ambiente

Render → **Environment**. Modelo: [`scripts/deploy/render-web-free.env.example`](../scripts/deploy/render-web-free.env.example).

| Key | Valor |
|-----|--------|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://cnkhzfphbkswiasgalww.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | do seu `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | do seu `.env` |
| `NEXT_PUBLIC_SITE_URL` | `https://<name>.onrender.com` (sem barra final) |

Opcional: `RESEND_API_KEY` + `EMAIL_FROM` ou `SMTP_*`.

**Create Web Service** → aguarde o build.

---

## 3. Redeploy se mudar a URL

`NEXT_PUBLIC_*` entram no build. Após corrigir `NEXT_PUBLIC_SITE_URL`: **Manual Deploy**.

---

## 4. Supabase Auth

Site URL e Redirects para `https://<name>.onrender.com/auth/callback` e `https://<name>.onrender.com/**`, mais `http://localhost:3000/**`.

```powershell
npm run supabase:auth-urls
```

(com `NEXT_PUBLIC_SITE_URL` no `.env.local` e `npx supabase login`)

---

## 5. Testar

Abra a URL Render, login, ponto, dashboard.

---

## 6. Cron RH (opcional)

Free não tem Cron no Render. Use [cron-job.org](https://cron-job.org) com `GET /api/cron/hr-reminders` e header `Authorization: Bearer CRON_SECRET`, ou confie no fallback no login.

---

## Limitações

Sleep após inatividade; Blueprint `render.yaml` usa Starter (pago).

Ver também [DEPLOY-RENDER.md](./DEPLOY-RENDER.md).
