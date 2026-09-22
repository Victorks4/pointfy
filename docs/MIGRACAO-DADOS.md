# Migração de dados (concluída) — Pontify → PontFy Senai

- **Origem (legado):** `royszemnvodpzhwswpmm`
- **Destino (produção):** `cnkhzfphbkswiasgalww`

A migração de usuários e dados públicos já foi feita. Este doc fica como referência para **senhas**, **Storage** e validação.

## Ambiente atual

- App: [Render Free](./DEPLOY-RENDER-FREE.md)
- Banco: [SUPABASE-SENAI.md](./SUPABASE-SENAI.md)
- Local: `.env` com as 3 chaves do projeto Senai

```bash
npm run db:check
```

## Sincronizar senhas no Senai (SQL Editor)

1. SQL Editor do projeto Senai → New query
2. Copie [`scripts/db/senai-sync-passwords.sql`](../scripts/db/senai-sync-passwords.sql) (local; não commitar)
3. **Run** — 51 linhas `UPDATE auth.users`

Regerar no projeto **antigo** `royszemnvodpzhwswpmm`:

```sql
SELECT string_agg(
  format(
    'UPDATE auth.users SET encrypted_password = %L WHERE id = %L::uuid;',
    encrypted_password,
    id
  ),
  E'\n'
) AS script_para_rodar_no_senai
FROM auth.users
WHERE encrypted_password IS NOT NULL;
```

## Storage

Bucket `justificativas`: copiar do legado se faltar. `supabase/seed.sql` se o bucket não existir.

## Validar

`node scripts/db/test-login.mjs` + login na URL Render.
