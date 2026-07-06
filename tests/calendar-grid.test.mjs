import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildMonthGrid, weekdayColumnForDateKey } from '../lib/calendar-grid.ts'

describe('buildMonthGrid', () => {
  it('julho/2026: dia 1 na quarta (coluna 3, domingo=0)', () => {
    const cells = buildMonthGrid(2026, 6)
    const first = cells.find((c) => c.inMonth && c.day === 1)
    assert.ok(first)
    const col = cells.indexOf(first) % 7
    assert.equal(col, 3)
    assert.equal(first.dateKey, '2026-07-01')
  })

  it('julho/2026: dia 6 na segunda (coluna 1)', () => {
    const cells = buildMonthGrid(2026, 6)
    const sixth = cells.find((c) => c.inMonth && c.day === 6)
    assert.ok(sixth)
    const col = cells.indexOf(sixth) % 7
    assert.equal(col, 1)
    assert.equal(weekdayColumnForDateKey('2026-07-06'), 1)
  })
})
