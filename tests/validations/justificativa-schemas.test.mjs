import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { justificativaInputSchema } from '../../lib/validations/schemas.ts'

describe('justificativaInputSchema atestado', () => {
  const base = {
    data: '2026-04-01',
    tipo: 'atestado',
    descricao: 'Consulta médica',
  }

  it('rejeita atestado sem arquivo', () => {
    const result = justificativaInputSchema.safeParse({
      ...base,
      arquivoPath: null,
    })
    assert.equal(result.success, false)
    if (!result.success) {
      assert.ok(
        result.error.issues.some((i) =>
          String(i.message).includes('Anexe o documento'),
        ),
      )
    }
  })

  it('aceita atestado com arquivoPath', () => {
    const result = justificativaInputSchema.safeParse({
      ...base,
      arquivoPath: 'user-id/123.pdf',
    })
    assert.equal(result.success, true)
  })
})
