# Padrões de teste — Pontify

Runner: `npm test` → `npx tsx --test tests/*.test.mjs`

## Estrutura

```javascript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
```

Importar módulos TS com extensão `.ts` a partir de `tests/`.

## Fixtures reutilizáveis

```javascript
const estagiario = {
  id: 'u1',
  cargo: 'estagiario',
  cargaHorariaSemanal: 30,
  dataInicioRecesso: null,
  dataFimRecesso: null,
  // …campos mínimos de User
}

const configPadrao = {
  metaDiariaMinutos: 360,
  limiteMinutosSemJustificativa: 370,
  rejeitarMinutosZero: true,
  horarioEntradaEsperado: '09:00',
}
```

## O que testar por módulo

| Módulo | Casos prioritários |
|--------|-------------------|
| `ponto.validator.ts` | total errado; zero minutos; bloqueio; recesso; hora extra sem justificativa; acima do limite |
| `banco-horas.ts` | saldo positivo/negativo; dia bloqueado ignorado; compensação aprovada |
| `compensacao-utils.ts` | minutos efetivos; afeta saldo |
| `presenca-bloqueio.ts` | data dentro/fora do intervalo |
| Schemas Zod | input inválido → mensagem PT-BR via `parseInput` |
| Scoping (services) | mock Supabase ou extrair funções puras de filtro |

## Exemplo — validator

```javascript
import { validatePontoBusinessRules } from '../lib/server/validators/ponto.validator.ts'

describe('validatePontoBusinessRules', () => {
  it('aceita registro válido dentro do limite', () => {
    assert.doesNotThrow(() =>
      validatePontoBusinessRules(
        {
          data: '2026-03-01',
          entrada1: '09:00',
          saida1: '15:00',
          entrada2: null,
          saida2: null,
          totalMinutos: 360,
          justificativaHoraExtra: null,
        },
        { user: estagiario, bloqueios: [], activeConfig: configPadrao },
      ),
    )
  })
})
```

## Exemplo — banco de horas

Ver `tests/banco-horas.test.mjs` e `tests/ponto.validator.test.mjs` como referência canônica.

## Quando mockar Supabase

Preferir **funções puras** testáveis sem mock. Para services com queries:

1. Extrair lógica de scoping para função pura e testar isoladamente, ou
2. Adicionar teste de integração futuro (Playwright/API) — marcar como gap na review.

## Anti-patterns em testes

- Testar implementação (nomes internos) em vez de comportamento
- Asserts fracos (`assert.ok(x)` sem valor esperado)
- Um único happy path sem bordas
- Testes que dependem de ordem de execução ou data atual sem fixar `data`

## Na review

Para cada finding em regra de negócio, incluir esboço:

```text
it('deve [comportamento esperado] quando [condição]')
```
