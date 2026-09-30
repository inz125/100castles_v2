import { describe, expect, it } from 'vitest'
import { castles } from './castles'
import { getRecord, progressOf, type StampBook } from './stampBook'
import { createEmptyRecord } from './stampRecord'

describe('getRecord', () => {
  it('記録がある城はその記録を返す', () => {
    const book: StampBook = { 59: { stampedOn: '2026-09-30', memo: '白鷺城' } }
    expect(getRecord(book, 59)).toEqual({ stampedOn: '2026-09-30', memo: '白鷺城' })
  })

  it('記録がない城は初期値（未押印）を返す', () => {
    expect(getRecord({}, 1)).toEqual(createEmptyRecord())
  })
})

describe('progressOf', () => {
  it('記録が空なら 0/100', () => {
    expect(progressOf(castles, {})).toEqual({ stamped: 0, total: 100 })
  })

  it('押印済みの城だけを数える（メモだけの記録は数えない）', () => {
    const book: StampBook = {
      1: { stampedOn: '2026-01-01', memo: '' },
      59: { stampedOn: '2026-09-30', memo: '' },
      100: { stampedOn: null, memo: '次は首里城' },
    }
    expect(progressOf(castles, book)).toEqual({ stamped: 2, total: 100 })
  })

  it('渡された城の一覧だけを対象にする', () => {
    const book: StampBook = {
      1: { stampedOn: '2026-01-01', memo: '' },
      59: { stampedOn: '2026-09-30', memo: '' },
    }
    const firstThree = castles.slice(0, 3)
    expect(progressOf(firstThree, book)).toEqual({ stamped: 1, total: 3 })
  })
})
