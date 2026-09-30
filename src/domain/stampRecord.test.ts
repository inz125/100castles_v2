import { describe, expect, it } from 'vitest'
import { createEmptyRecord, isStamped } from './stampRecord'

describe('記録', () => {
  it('初期値は未押印・押印日なし・メモ空', () => {
    const record = createEmptyRecord()
    expect(record).toEqual({ stampedOn: null, memo: '' })
    expect(isStamped(record)).toBe(false)
  })

  it('押印日があれば押印済み', () => {
    expect(isStamped({ stampedOn: '2026-09-30', memo: '' })).toBe(true)
  })

  it('初期値は呼ぶたびに別のオブジェクト', () => {
    expect(createEmptyRecord()).not.toBe(createEmptyRecord())
  })
})
