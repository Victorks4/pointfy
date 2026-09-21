# Estrutura do repositório

Guia rápido para localizar código e manter o projeto organizado.

## Visão geral

| Pasta | Responsabilidade |
|-------|------------------|
| `app/` | Rotas Next.js (páginas finas), API routes, Server Actions em `app/actions/` |
| `components/` | UI React por domínio |
| `lib/` | Lógica compartilhada, Supabase, domínio e servidor |
| `supabase/` | Migrations SQL e `seed.sql` |
| `scripts/` | Automação (`db/`, `deploy/`, `dev/`) |
| `tests/` | Testes unitários espelhando `lib/` |
| `e2e/` | Playwright |
| `docs/` | Documentação técnica |

## `lib/`

- `client/` — contextos React (auth, data)
- `domain/ponto/` — banco de horas, recesso, presença, compensação
- `domain/relatorios/`, `domain/shared/`
- `server/` — services, e-mail, validators (somente servidor)
- `supabase/`, `validations/`, `hooks/`, `auth/`, `data/`, `fy/`, `constants/`

Client components grandes ficam em `components/` (gestor, ponto, admin), não em `app/`.

## `tests/`

`tests/domain/ponto/`, `tests/server/`, `tests/auth/`, `tests/validations/`, `tests/lib/`

Ver também `docs/BACKEND.md` e `docs/DEPLOY-VERCEL.md`.
