---
name: senior-code-review
description: Realiza code review sênior com foco em qualidade de sistema, segurança, performance e testes automatizados. Use quando o usuário pedir code review, revisão de PR, auditoria de código, revisão antes de merge, ou avaliação de mudanças no Pontify (Next.js + Supabase).
disable-model-invocation: false
---

# Senior Code Review — Pontify

Review de nível staff: correção, segurança, arquitetura, performance e **testes automatizados obrigatórios** para lógica de negócio.

## Princípios

1. **Evidência** — cite arquivo e trecho; não opine sem ler o diff.
2. **Risco primeiro** — auth, RLS, regras de ponto e vazamento server/client antes de estilo.
3. **Testes são parte do review** — mudança em regra de negócio sem teste é finding **Critical** ou **High**.
4. **Defense in depth** — app layer + RLS + Zod; nunca confiar só em uma camada.
5. **Diff mínimo** — não exigir refactors fora do escopo; sinalizar débito separado.

## Workflow

```
Progresso:
- [ ] 1. Entender escopo (diff, issue, arquivos tocados)
- [ ] 2. Rodar verificação automatizada (build, test, lint)
- [ ] 3. Review por camadas (ver checklist abaixo)
- [ ] 4. Avaliar cobertura de testes (existentes + gaps)
- [ ] 5. Escrever veredito estruturado
- [ ] 6. Propor/criar testes se faltarem e o usuário quiser correção
```

### Passo 1 — Escopo

Identifique: feature/bugfix/refactor? Toca `lib/server/`, `app/actions/`, migrations, RLS, UI?

### Passo 2 — Verificação automatizada (obrigatório)

Executar na raiz do projeto:

```bash
npm test
npm run build
npm run lint
```

Se algum falhar, reportar como **Critical** antes de aprovar. Se não puder rodar, declarar limitação.

### Passo 3 — Review por camadas

Ordem fixa:

| # | Camada | O que validar |
|---|--------|----------------|
| 1 | **Segurança / Auth** | `requireAuth`/`requireRole`, scoping por `userId`, `createAdminClient` justificado |
| 2 | **RLS ↔ App** | Policies em `supabase/migrations/` coerentes com services |
| 3 | **Validação** | Zod (`parseInput`) + regras de negócio (`ponto.validator`, compensação) |
| 4 | **Arquitetura** | Lógica em `lib/server/services/*`, mutações via Server Actions + `runAction` |
| 5 | **Boundaries** | Nada de `lib/server/*` importado por `'use client'` (exceto tipos puros) |
| 6 | **Performance** | Janela 180d, limite admin 500, `query-columns`, cache/revalidate |
| 7 | **UX** | `ActionResult`, erros PT-BR, `success: false` com toast |
| 8 | **Testes** | Ver seção abaixo |

Checklist Pontify detalhado: [pontify-checklist.md](pontify-checklist.md).

### Passo 4 — Política de testes

**Exige teste novo ou atualizado** quando o diff altera:

- `lib/server/validators/*`, `lib/server/banco-horas.ts`
- Regras de compensação, bloqueio, recesso, limites de hora extra
- Scoping por cargo (`listPontosScoped`, `listJustificativasScoped`, etc.)
- Mappers com transformação não trivial
- Schemas Zod com refinements ou `.superRefine`

**Runner do projeto:** `npx tsx --test tests/*.test.mjs` (Node `node:test` + `node:assert/strict`).

**Padrão de arquivo de teste:**

```javascript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validatePontoBusinessRules } from '../lib/server/validators/ponto.validator.ts'

describe('validatePontoBusinessRules', () => {
  it('rejeita totalMinutos inconsistente com horários', () => {
    assert.throws(() => validatePontoBusinessRules(/* ... */))
  })
})
```

Prioridade de casos: happy path, borda (meta, meta+1h, bloqueio, recesso), autorização negada, regressão de bug reportado.

Mais exemplos: [test-patterns.md](test-patterns.md).

**Sem teste aceitável só se:** mudança puramente visual/CSS, copy, ou config sem lógica — documentar na review.

### Passo 5 — Formato do veredito

```markdown
# Code Review — [título curto]

**Veredito:** Aprovar | Aprovar com ressalvas | Pedir mudanças | Bloquear

## Resumo
[2–4 frases: o que mudou, risco principal, estado dos testes]

## Findings

### Critical
- [arquivo:linha] Descrição. **Por quê:** … **Fix:** … **Teste:** …

### High
- …

### Medium
- …

### Low / Nit
- …

## Testes
- Executados: `npm test` → pass/fail
- Cobertura do diff: [adequada | insuficiente — listar gaps]
- Testes sugeridos: [lista concreta de `describe`/`it`]

## Checklist rápido
- [x] Auth/scoping
- [ ] …
```

Severidades:

| Nível | Critério |
|-------|----------|
| **Critical** | Vulnerabilidade, perda de dados, quebra de regra de negócio, build/test falhando |
| **High** | IDOR provável, RLS divergente, lógica sem teste, boundary server/client |
| **Medium** | Performance, `select('*')`, cache incorreto, DX |
| **Low** | Naming, duplicação menor, comentários |

## Red flags imediatos (Pontify)

- `select('*')` em hot path sem justificativa
- Mutação via `fetch` POST em vez de Server Action
- `throw` no client em vez de `ActionResult`
- `userId` vindo do client sem checagem de papel no service
- Upload sem `validateUploadFile`
- Migration sem policy RLS correspondente
- `revalidateTag` com um argumento (Next.js 16 exige segundo arg, ex. `'max'`)
- Dados pessoais em cache público/CDN

## Após o review

Se o usuário pedir correções: implementar fixes + testes na mesma PR. Rodar `npm test` e `npm run build` antes de encerrar.

## Referências do repo

| Tópico | Path |
|--------|------|
| Backend | `docs/BACKEND.md` |
| Performance | `docs/performance.md` |
| Actions | `app/actions/*.ts` |
| Services | `lib/server/services/*.ts` |
| Zod | `lib/validations/schemas.ts` |
| RLS | `supabase/migrations/002_rls_policies.sql` |
| Testes existentes | `tests/*.test.mjs` |
