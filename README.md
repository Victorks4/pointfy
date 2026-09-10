# Pointfy (Pontify)

Sistema de ponto e gestao de presenca — Next.js 16, TypeScript, Tailwind e Supabase.

## Estrutura do projeto

```
app/              Rotas, paginas e API (Next.js App Router)
components/
  admin/          Telas e widgets de administracao
  auth/           Login, troca de senha, animacoes de entrada
  dashboard/      Layout, sidebar, streak, providers
  fy/             Assistente Fy (guia, tour, video)
  ponto/          Relogio, calendario, campos de horario
  shared/         Theme, creditos, providers compartilhados
  ui/             Componentes shadcn/ui
lib/              Logica de negocio, Supabase, validacoes
scripts/
  db/             Seed, senhas, perfis (Supabase)
  deploy/         Vercel, env, URLs de auth
  dev/            Bundle analyzer, icones
supabase/         Migrations e seed SQL
tests/            Testes unitarios (.test.mjs)
e2e/              Testes Playwright
docs/             Documentacao tecnica
```

## Comandos

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de producao |
| `npm test` | Testes unitarios |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run db:seed` | Usuarios demo no Supabase |
| `npm run db:check` | Verifica conexao Supabase |
| `npm run vercel:env` | Sincroniza variaveis com Vercel |

## Configuracao

1. Copie `.env.example` para `.env.local` e preencha as chaves do Supabase.
2. Execute as migrations em `supabase/migrations/`.
3. Rode `npm run db:seed` para criar usuarios de demonstracao.

Documentacao detalhada: `docs/BACKEND.md`, `docs/DEPLOY-VERCEL.md`.
