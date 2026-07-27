# Segurança — Supabase Database Linter

Última verificação: **15 de julho de 2026**

Migration aplicada: [`supabase/migrations/012_security_linter_hardening.sql`](../supabase/migrations/012_security_linter_hardening.sql)

## Resumo

| Status | Quantidade |
|--------|------------|
| Corrigido (código/migration) | 12 |
| Pendente (configuração manual) | 1 |

## Warnings corrigidos

### `function_search_path_mutable` (3 ocorrências)

Funções `SECURITY DEFINER` sem `search_path` fixo permitiam teoricamente ataques de hijack de `search_path`.

| Função | Remediação |
|--------|------------|
| `set_updated_at` | Movida para `private`; recriada com `SET search_path = public` |
| `auth_user_role` | Movida para `private`; recriada com `SET search_path = public` |
| `auth_user_gestor_id` | **Removida** (código morto, não usada em nenhuma policy) |

### `anon_security_definer_function_executable` (4 ocorrências)

Visitantes não autenticados podiam chamar funções internas via `POST /rest/v1/rpc/*`.

| Função | Remediação |
|--------|------------|
| `auth_user_role` | Movida para schema `private` (fora do PostgREST) |
| `auth_user_gestor_id` | Removida |
| `handle_new_user` | Movida para `private` (apenas trigger em `auth.users`) |
| `is_gestor_of_estagiario` | Movida para `private` |

### `authenticated_security_definer_function_executable` (4 ocorrências)

Usuários logados podiam chamar RPCs internos diretamente — em especial `is_gestor_of_estagiario`, que permitia sondar vínculos gestor↔estagiário bypassando RLS.

| Função | Remediação |
|--------|------------|
| `auth_user_role` | Schema `private` |
| `auth_user_gestor_id` | Removida |
| `handle_new_user` | Schema `private` |
| `is_gestor_of_estagiario` | Schema `private` |

Também movida preventivamente: `auth_user_linked_gestor_ids` (migration 011).

### Permissões no schema `private`

- `REVOKE ALL` de `PUBLIC` e `anon`
- `GRANT USAGE` + `EXECUTE` apenas para `authenticated` e `service_role` (necessário para policies RLS)

## Rotação de credenciais (histórico Git)

Scripts com senhas em texto (`scripts/create-admin-allana.mjs`, `scripts/sql/create-admin-allana.sql`) foram **removidos** do repositório. Se já foram usados em produção, **rotacione a senha** dos usuários afetados no Supabase (Authentication → Users → reset password).

`docs/DADOS-API.md` é apenas para notas locais — está no `.gitignore` e não deve ser commitado.

## Warning pendente (ação manual)

### `auth_leaked_password_protection`

| Campo | Valor |
|-------|-------|
| Severidade | WARN |
| Descrição | Proteção contra senhas vazadas (HaveIBeenPwned) desabilitada |
| Remediação | [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) |

**Como habilitar:**

1. Abra o [Dashboard Supabase](https://supabase.com/dashboard) → projeto **Pontify**
2. **Authentication** → **Providers** → **Email**
3. Em **Password Security**, ative **Leaked password protection**

> Nota: essa funcionalidade pode exigir plano **Pro** ou superior no Supabase.

Alternativa via Management API (requer Personal Access Token):

```http
PATCH /v1/projects/royszemnvodpzhwswpmm/config/auth
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
Content-Type: application/json

{ "password_hibp_enabled": true }
```

## Validação pós-migration

- [x] Advisors de segurança: 12/13 warnings resolvidos (resta apenas `auth_leaked_password_protection`)
- [x] Suite de testes local: `npm test` — 84 testes passando
- [ ] Smoke manual recomendado:
  - Login estagiário / gestor / admin
  - Gestor visualiza equipe
  - Estagiário vê gestor no relatório PDF
  - Admin cria usuário (trigger `private.handle_new_user`)
  - Update de ponto (trigger `private.set_updated_at`)

## Arquitetura após hardening

```
PostgREST (schema public)
  └── tabelas + RLS policies
        └── chamam funções em schema private (não expostas via RPC)

private schema
  ├── auth_user_role()
  ├── is_gestor_of_estagiario(uuid)
  ├── auth_user_linked_gestor_ids()
  ├── handle_new_user()      → trigger auth.users
  └── set_updated_at()       → trigger ponto_registros
```
