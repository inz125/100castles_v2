import { describe, expect, it } from 'vitest'
import { michinoeki } from './michinoeki'
import {
  completedPrefectureCount,
  filterPrefectureGroups,
  groupByPrefecture,
  isVisited,
  michinoekiPrefectureNumbers,
  MICHINOEKI_PREFECTURES,
  visitProgressOf,
  visitsToImport,
  type VisitBook,
} from './michinoekiVisits'

const idsIn = (prefecture: string) =>
  michinoeki.filter((s) => s.prefecture === prefecture).map((s) => s.id)

describe('道の駅の訪問', () => {
  it('行った日がある駅だけを行ったとみなす', () => {
    const visits: VisitBook = { 3: '2026-10-01' }
    expect(isVisited(visits, 3)).toBe(true)
    expect(isVisited(visits, 4)).toBe(false)
  })

  it('全体の進捗は行った駅の数と全駅の数', () => {
    expect(visitProgressOf(michinoeki, { 1: '2026-10-01', 2: '2026-10-02' })).toEqual({
      stamped: 2,
      total: michinoeki.length,
    })
  })

  it('対象の県はマスタの県と一致する', () => {
    expect(new Set(michinoeki.map((s) => s.prefecture))).toEqual(new Set(MICHINOEKI_PREFECTURES))
  })

  it('県ごとに、決まった県の順・番号順でまとめ、県ごとの進捗を持つ', () => {
    const aichi = idsIn('愛知県')
    const groups = groupByPrefecture({ [aichi[0]]: '2026-10-01' })
    expect(groups.map((g) => g.prefecture)).toEqual([...MICHINOEKI_PREFECTURES])
    expect(groups.reduce((sum, g) => sum + g.stations.length, 0)).toBe(michinoeki.length)
    expect(groups[0].stations.map((s) => s.id)).toEqual(aichi.toSorted((a, b) => a - b))
    expect(groups[0].progress).toEqual({ stamped: 1, total: aichi.length })
    expect(groups[1].progress).toEqual({ stamped: 0, total: idsIn('岐阜県').length })
  })

  it('絞り込むと駅が残らない県は除き、県の進捗は県全体のまま', () => {
    const [first] = idsIn('三重県')
    const visits: VisitBook = { [first]: '2026-10-01' }
    const groups = groupByPrefecture(visits)

    const visited = filterPrefectureGroups(groups, visits, 'visited')
    expect(visited.map((g) => g.prefecture)).toEqual(['三重県'])
    expect(visited[0].stations.map((s) => s.id)).toEqual([first])
    expect(visited[0].progress).toEqual({ stamped: 1, total: idsIn('三重県').length })

    const unvisited = filterPrefectureGroups(groups, visits, 'unvisited')
    expect(unvisited).toHaveLength(5)
    expect(unvisited.find((g) => g.prefecture === '三重県')!.stations).toHaveLength(
      idsIn('三重県').length - 1,
    )

    expect(filterPrefectureGroups(groups, visits, 'all')).toEqual(groups)
  })

  it('すべての駅に行った県を制覇した県として数える', () => {
    const visits: VisitBook = Object.fromEntries(idsIn('長野県').map((id) => [id, '2026-10-01']))
    expect(completedPrefectureCount(groupByPrefecture(visits))).toBe(1)
    expect(completedPrefectureCount(groupByPrefecture({}))).toBe(0)
  })
})

describe('訪問帳の取り込み', () => {
  it('クラウドにまだ記録がない駅だけを取り込む', () => {
    const local: VisitBook = { 1: '2026-10-01', 2: '2026-10-02', 3: '2026-10-03' }
    // 2 は行ったことになっている駅、3 はもう 1 人が行っていないことにした駅
    expect(visitsToImport(local, new Set([2, 3]))).toEqual({ 1: '2026-10-01' })
  })

  it('端末に記録がなければ何も取り込まない', () => {
    expect(visitsToImport({}, new Set())).toEqual({})
  })
})

describe('県ごとの番号（D-68）', () => {
  const numbers = michinoekiPrefectureNumbers()

  it.each([
    ['愛知県', 19],
    ['岐阜県', 53],
    ['三重県', 18],
    ['静岡県', 27],
    ['長野県', 18],
  ])('%s は駅マスタの番号順に 1 から %i まで欠けずに並ぶ', (prefecture, count) => {
    const ids = idsIn(prefecture).toSorted((a, b) => a - b)
    expect(ids.map((id) => numbers.get(id))).toEqual(Array.from({ length: count }, (_, i) => i + 1))
  })

  it('すべての駅に番号がある', () => {
    expect(michinoeki.every((s) => numbers.has(s.id))).toBe(true)
  })

  it('愛知県の最初の駅（豊根グリーンポート宮嶋）は 1、岐阜県の最初の駅も 1', () => {
    const toyone = michinoeki.find((s) => s.name === '豊根グリーンポート宮嶋')!
    expect(numbers.get(toyone.id)).toBe(1)
    expect(numbers.get(idsIn('岐阜県')[0])).toBe(1)
  })
})
