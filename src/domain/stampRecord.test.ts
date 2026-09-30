import { describe, expect, it } from 'vitest'
import { createEmptyRecord, isStamped, setMemo, setStamped, setStampedDate } from './stampRecord'

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

describe('setStampedDate', () => {
  const stamped = { stampedOn: '2026-09-30', memo: 'メモ' }

  it('押印済みなら押印日を変更できる', () => {
    expect(setStampedDate(stamped, '2026-05-05')).toEqual({ stampedOn: '2026-05-05', memo: 'メモ' })
  })

  it('未押印なら押印日を設定できない（記録は変わらない）', () => {
    const record = createEmptyRecord()
    expect(setStampedDate(record, '2026-05-05')).toEqual(record)
  })

  it.each(['', '2026-5-5', '2026/05/05', '2026-02-30', 'abc'])(
    '日付として正しくない値 "%s" では押印日は変わらない',
    (value) => {
      expect(setStampedDate(stamped, value)).toEqual(stamped)
    },
  )

  it('元の記録は書き換えない', () => {
    const original = { ...stamped }
    setStampedDate(original, '2026-05-05')
    expect(original).toEqual(stamped)
  })
})

describe('setMemo', () => {
  it('メモを変更できる（押印日は変わらない）', () => {
    const record = { stampedOn: '2026-09-30', memo: '' }
    expect(setMemo(record, '雨でも登城')).toEqual({ stampedOn: '2026-09-30', memo: '雨でも登城' })
  })

  it('メモを空にできる', () => {
    expect(setMemo({ stampedOn: null, memo: 'a' }, '').memo).toBe('')
  })

  it('元の記録は書き換えない', () => {
    const original = createEmptyRecord()
    setMemo(original, 'x')
    expect(original).toEqual(createEmptyRecord())
  })
})
