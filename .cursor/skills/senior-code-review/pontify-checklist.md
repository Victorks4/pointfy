# Checklist Pontify — Code Review

Use após o workflow principal em [SKILL.md](SKILL.md).

## Arquitetura Next.js

- [ ] Mutações em `app/actions/*` com `'use server'`, `runAction`, `revalidatePath`/`revalidateTag`
- [ ] Leituras pesadas em `app/api/v1/*` com `dynamic = 'force-dynamic'` e `Cache-Control: private, no-store`
- [ ] Bootstrap em `/api/v1/data`; pontos/justificativas em rotas dedicadas
- [ ] `DataProvider` só em `/dashboard`, não na raiz
- [ ] Componentes pesados (GSAP, Three, jspdf) com `dynamic()` ou import sob demanda

## Auth e papéis

Papéis: `estagiario`, `gestor`, `admin`.

- [ ] `requireAuth()` / `requireRole(...)` no início do service
- [ ] Estagiário: só `session.id`
- [ ] Gestor: equipe via `gestor_id` — espelhar `listPontosScoped` ao filtrar por `userId`
- [ ] Admin: sem vazar tabela inteira; janela 180d + limite 500
- [ ] `getBancoHorasForUser` / APIs com `userId` validam permissão no app layer
- [ ] `createAdminClient` só servidor; uso documentado (ex.: notificação ao gestor)

## Validação e regras de ponto

- [ ] Input `unknown` → `parseInput(schema, input)` (Zod)
- [ ] Ponto: `assertPontoBusinessRules` após merge de campos
- [ ] `totalMinutos` consistente com entrada/saída
- [ ] Bloqueio de presença, recesso, data futura
- [ ] Hora extra: justificativa só após meta + 1h (`getLimiteMinutosSemJustificativa`)
- [ ] Compensação: fluxo `pendente_gestor` → aprovar/rejeitar com notificação

## Supabase / SQL

- [ ] Nova tabela: migration numerada sem colisão (`003_*` duplicado = red flag)
- [ ] RLS em todas as tabelas; INSERT/UPDATE com `WITH CHECK`
- [ ] Colunas explícitas via `lib/server/query-columns.ts`
- [ ] Índices para novos filtros (`ORDER BY`, `WHERE tipo/status`, `user_id`)
- [ ] App layer alinhado às policies (ex.: admin criar ponto vs `pontos_insert_own`)

## Storage

- [ ] Bucket `justificativas`; path `{userId}/{timestamp}.ext`
- [ ] `validateUploadFile` (MIME + 5MB)
- [ ] `createSignedUrls` em lote — evitar N+1
- [ ] Snapshot do dashboard sem URLs assinadas; `sign=1` sob demanda

## Cache

- [ ] `ponto_configs` / `desafios_semanais`: `unstable_cache` + tag
- [ ] Mutações admin: `revalidateTag('ponto-configs', 'max')` etc.
- [ ] Ponto/justificativa: nunca cache público

## Client / Server boundary

- [ ] `'use client'` não importa `lib/server/services/*` nem validators
- [ ] `lib/data-context.tsx` não duplica regra de negócio — só orquestra
- [ ] Tipos: preferir `lib/types.ts` compartilhado a importar service só por tipo

## Testes (obrigatório para lógica)

- [ ] `npm test` passa
- [ ] Novos casos em `tests/*.test.mjs` para regras alteradas
- [ ] Fixtures mínimas: `User`, `PontoConfig`, bloqueios, justificativas
- [ ] Casos de borda documentados no `it('...')`

## Ops

- [ ] Sem secrets no código
- [ ] `.env.example` atualizado se novas vars
- [ ] Mensagens de erro em PT-BR
