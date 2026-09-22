# Pointfy (Pontify)

Sistema de ponto e gestao de presenca — Next.js 16, TypeScript, Tailwind e Supabase.

## Estrutura

**[docs/STRUCTURE.md](docs/STRUCTURE.md)** — mapa completo de pastas.

## Comandos

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de producao |
| `npm test` | Testes unitarios |
| `npm run test:e2e` | Playwright |
| `npm run db:seed` | Usuarios demo |
| `npm run db:check` | Conexao Supabase |

## Configuracao

1. `.env.local` a partir de `.env.example`
2. Migrations em `supabase/migrations/`
3. `docs/BACKEND.md`, `docs/DEPLOY-RENDER-FREE.md` (Render Free), `docs/DEPLOY-VERCEL.md` (legado)
