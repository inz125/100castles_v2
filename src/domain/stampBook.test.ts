import { describe, expect, it } from 'vitest'
import { castles, REGIONS } from './castles'
import { getRecord, groupByRegion, progressOf, type StampBook } from './stampBook'
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

describe('groupByRegion', () => {
  it('6 地方をスタンプ帳の順に並べる', () => {
    expect(groupByRegion(castles, {}).map((g) => g.region)).toEqual(REGIONS)
  })

  it('各地方の城は番号順で、100 城がちょうど 1 回ずつ含まれる', () => {
    const groups = groupByRegion(castles, {})
    expect(groups.map((g) => g.castles.length)).toEqual([13, 19, 16, 14, 22, 16])
    expect(groups.flatMap((g) => g.castles.map((c) => c.number))).toEqual(
      castles.map((c) => c.number),
    )
  })

  it('地方ごとの進捗を持つ', () => {
    const book: StampBook = {
      2: { stampedOn: '2026-01-01', memo: '' }, // 北海道・東北
      8: { stampedOn: '2026-01-02', memo: '' }, // 北海道・東北
      59: { stampedOn: '2026-09-30', memo: '' }, // 近畿
    }
    const progressByRegion = Object.fromEntries(
      groupByRegion(castles, book).map((g) => [g.region, g.progress]),
    )
    expect(progressByRegion['北海道・東北']).toEqual({ stamped: 2, total: 13 })
    expect(progressByRegion['近畿']).toEqual({ stamped: 1, total: 14 })
    expect(progressByRegion['九州・沖縄']).toEqual({ stamped: 0, total: 16 })
  })
})
