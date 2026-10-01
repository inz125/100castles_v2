import { describe, expect, it } from 'vitest'
import { castles, REGIONS } from './castles'
import {
  completionByStamping,
  filterCastles,
  filterGroups,
  getRecord,
  groupByRegion,
  isCompleted,
  progressOf,
  type RegionGroup,
  type StampBook,
} from './stampBook'
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

describe('filterCastles', () => {
  const book: StampBook = {
    2: { stampedOn: '2026-01-01', memo: '' },
    59: { stampedOn: '2026-09-30', memo: '' },
    3: { stampedOn: null, memo: '未押印のメモ' },
  }
  const targets = castles.slice(0, 5).concat(castles[58])
  const numbersOf = (cs: readonly { number: number }[]) => cs.map((c) => c.number)

  it('すべて：そのまま返す', () => {
    expect(filterCastles(targets, book, 'all')).toEqual(targets)
  })

  it('押印済み：押印済みの城だけを並び順のまま返す', () => {
    expect(numbersOf(filterCastles(targets, book, 'stamped'))).toEqual([2, 59])
  })

  it('未押印：記録がない城・押印日のない記録の城を返す', () => {
    expect(numbersOf(filterCastles(targets, book, 'unstamped'))).toEqual([1, 3, 4, 5])
  })
})

describe('filterGroups', () => {
  // 北海道・東北は 13 城すべて押印済み、近畿は 59 番（姫路城）だけ押印済み
  const book: StampBook = {
    ...Object.fromEntries(
      castles
        .filter((c) => c.region === '北海道・東北')
        .map((c) => [c.number, { stampedOn: '2026-01-01', memo: '' }]),
    ),
    59: { stampedOn: '2026-09-30', memo: '' },
  }
  const groups = groupByRegion(castles, book)
  const numbersOf = (gs: RegionGroup[]) => gs.flatMap((g) => g.castles.map((c) => c.number))

  it('すべて：そのまま返す', () => {
    expect(filterGroups(groups, book, 'all')).toEqual(groups)
  })

  it('押印済み：押印済みの城だけ残し、城が残らない地方は除く', () => {
    const filtered = filterGroups(groups, book, 'stamped')
    expect(filtered.map((g) => g.region)).toEqual(['北海道・東北', '近畿'])
    expect(numbersOf(filtered)).toEqual([...Array.from({ length: 13 }, (_, i) => i + 1), 59])
  })

  it('未押印：未押印の城だけ残し、城が残らない地方は除く', () => {
    const filtered = filterGroups(groups, book, 'unstamped')
    expect(filtered.map((g) => g.region)).not.toContain('北海道・東北')
    expect(numbersOf(filtered)).toHaveLength(100 - 14)
    expect(numbersOf(filtered)).not.toContain(59)
  })

  it('絞り込んでも地方の進捗は地方全体のまま', () => {
    const kinki = filterGroups(groups, book, 'unstamped').find((g) => g.region === '近畿')
    expect(kinki?.castles).toHaveLength(13)
    expect(kinki?.progress).toEqual({ stamped: 1, total: 14 })
  })
})

describe('isCompleted', () => {
  it('押印済みが全体の数に届いていれば制覇', () => {
    expect(isCompleted({ stamped: 13, total: 13 })).toBe(true)
  })

  it('1 つでも残っていれば制覇ではない', () => {
    expect(isCompleted({ stamped: 12, total: 13 })).toBe(false)
  })

  it('対象の城がなければ制覇ではない', () => {
    expect(isCompleted({ stamped: 0, total: 0 })).toBe(false)
  })
})

describe('completionByStamping', () => {
  const stamped = { stampedOn: '2026-10-01', memo: '' } as const
  const unstamped = { stampedOn: null, memo: '' } as const
  /** 指定した城をすべて押印済みにした記録帳 */
  const bookOf = (numbers: readonly number[]): StampBook =>
    Object.fromEntries(numbers.map((n) => [n, stamped]))
  const tohoku = castles.filter((c) => c.region === '北海道・東北').map((c) => c.number)
  const all = castles.map((c) => c.number)

  it('地方の最後の 1 城を押印済みにすると、その地方の制覇', () => {
    const book = bookOf(tohoku.filter((n) => n !== 13))
    expect(completionByStamping(book, 13, stamped)).toEqual({
      kind: 'region',
      region: '北海道・東北',
    })
  })

  it('最後の 1 城で 100 城が揃えば、地方ではなく 100 城の制覇', () => {
    const book = bookOf(all.filter((n) => n !== 59))
    expect(completionByStamping(book, 59, stamped)).toEqual({ kind: 'all' })
  })

  it('地方に未押印の城が残っていれば何もない', () => {
    expect(completionByStamping({}, 1, stamped)).toBeNull()
  })

  it('もともと押印済みの城（押印日の変更など）なら何もない', () => {
    const book = bookOf(tohoku)
    expect(completionByStamping(book, 13, { stampedOn: '2026-09-01', memo: '' })).toBeNull()
  })

  it('押印済みを外したときは何もない', () => {
    const book = bookOf(tohoku)
    expect(completionByStamping(book, 13, unstamped)).toBeNull()
  })
})
