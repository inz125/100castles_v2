import { describe, expect, it } from 'vitest'
import { createEmptyRecord, isStamped, setStamped } from './stampRecord'

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

describe('setStamped', () => {
  const TODAY = '2026-09-30'

  it('ON にすると押印日に今日の日付が入る', () => {
    const record = setStamped(createEmptyRecord(), true, TODAY)
    expect(record.stampedOn).toBe(TODAY)
    expect(isStamped(record)).toBe(true)
  })

  it('すでに押印済みのとき ON にしても押印日は変わらない', () => {
    const record = setStamped({ stampedOn: '2026-01-01', memo: '' }, true, TODAY)
    expect(record.stampedOn).toBe('2026-01-01')
  })

  it('OFF にすると押印日が消える', () => {
    const record = setStamped({ stampedOn: '2026-01-01', memo: '' }, false, TODAY)
    expect(record.stampedOn).toBeNull()
    expect(isStamped(record)).toBe(false)
  })

  it('メモは変わらない', () => {
    const memo = '天守からの眺めが良い'
    expect(setStamped({ stampedOn: null, memo }, true, TODAY).memo).toBe(memo)
    expect(setStamped({ stampedOn: TODAY, memo }, false, TODAY).memo).toBe(memo)
  })

  it('元の記録は書き換えない', () => {
    const original = createEmptyRecord()
    setStamped(original, true, TODAY)
    expect(original).toEqual(createEmptyRecord())
  })
})
