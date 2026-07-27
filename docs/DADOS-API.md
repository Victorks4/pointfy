# Credenciais de API (não versionar)

As chaves ficam em `.env.local` (local) e nas Environment Variables da Vercel.

- **Resend:** `RESEND_API_KEY`, `EMAIL_FROM`
- **Destinatário atestados (código):** `ngpsenaifeira@fieb.org.br`

Para sincronizar local → Vercel:

```bash
npm run vercel:env
```
