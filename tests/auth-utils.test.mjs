import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeInternalRedirectPath } from '../lib/auth/safe-redirect.ts'
import { getDashboardPathForRole } from '../lib/auth-routes.ts'
import { toActionError, formatZodError, runAction } from '../lib/server/action-result.ts'
import { z } from 'zod'

describe('sanitizeInternalRedirectPath', () => {
  it('aceita path interno', () => {
    assert.equal(sanitizeInternalRedirectPath('/dashboard/ponto'), '/dashboard/ponto')
  })

  it('rejeita URL externa', () => {
    assert.equal(sanitizeInternalRedirectPath('https://evil.com'), '/dashboard')
  })

  it('rejeita protocol-relative', () => {
    assert.equal(sanitizeInternalRedirectPath('//evil.com'), '/dashboard')
  })
})

describe('getDashboardPathForRole', () => {
  it('admin vai para /dashboard/admin', () => {
    assert.equal(getDashboardPathForRole('admin'), '/dashboard/admin')
  })

  it('gestor vai para /dashboard/gestor', () => {
    assert.equal(getDashboardPathForRole('gestor'), '/dashboard/gestor')
  })

  it('estagiario vai para /dashboard', () => {
    assert.equal(getDashboardPathForRole('estagiario'), '/dashboard')
  })
})

describe('toActionError', () => {
  it('formata ZodError', () => {
    const schema = z.object({ email: z.string().email() })
    const parsed = schema.safeParse({ email: 'invalid' })
    if (parsed.success) return
    assert.ok(toActionError(parsed.error).length > 0)
  })

  it('formata Error', () => {
    assert.equal(toActionError(new Error('falhou')), 'falhou')
  })
})

describe('formatZodError', () => {
  it('junta mensagens', () => {
    const schema = z.object({ a: z.string().min(1) })
    const parsed = schema.safeParse({ a: '' })
    if (parsed.success) return
    assert.ok(formatZodError(parsed.error).includes('String'))
  })
})

describe('runAction', () => {
  it('retorna success com data', async () => {
    const result = await runAction(async () => 42)
    assert.equal(result.success, true)
    if (result.success) assert.equal(result.data, 42)
  })

  it('retorna error em falha', async () => {
    const result = await runAction(async () => {
      throw new Error('falhou')
    })
    assert.equal(result.success, false)
    if (!result.success) assert.equal(result.error, 'falhou')
  })
})
