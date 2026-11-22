import { isCompleted, type Progress } from './stampBook'
import { michinoeki, type Michinoeki } from './michinoeki'
import type { IsoDate } from './stampRecord'

/** 対象の県（「中部『道の駅』スタンプブック」と同じ区分。並び順は表示の順） */
export const MICHINOEKI_PREFECTURES = ['愛知県', '岐阜県', '三重県', '静岡県', '長野県'] as const

export type MichinoekiPrefecture = (typeof MICHINOEKI_PREFECTURES)[number]

/**
 * 道の駅の訪問帳：駅の番号 → 行った日。
 * 行っていない駅は持たない（行った ⇔ 行った日がある、を型の上で保証するため）
 */
export type VisitBook = Readonly<Partial<Record<number, IsoDate>>>

export function isVisited(visits: VisitBook, stationId: number): boolean {
  return visits[stationId] !== undefined
}

/** 渡された駅のうち、行った駅の数と全体の数（進捗の形は城と同じ） */
export function visitProgressOf(targets: readonly Michinoeki[], visits: VisitBook): Progress {
  const stamped = targets.filter((s) => isVisited(visits, s.id)).length
  return { stamped, total: targets.length }
}

export type PrefectureGroup = {
  prefecture: MichinoekiPrefecture
  stations: readonly Michinoeki[]
  progress: Progress
}

/** 駅を県ごとにまとめる（県は MICHINOEKI_PREFECTURES の順、駅は番号順） */
export function groupByPrefecture(
  visits: VisitBook,
  targets: readonly Michinoeki[] = michinoeki,
): PrefectureGroup[] {
  return MICHINOEKI_PREFECTURES.map((prefecture) => {
    const stations = targets
      .filter((s) => s.prefecture === prefecture)
      .toSorted((a, b) => a.id - b.id)
    return { prefecture, stations, progress: visitProgressOf(stations, visits) }
  })
}

export type VisitFilter = 'all' | 'unvisited' | 'visited'

/**
 * 県ごとの駅を、行ったかどうかで絞り込む。駅が残らない県は除く。
 * 県の進捗は絞り込み前（県全体）のまま残す
 */
export function filterPrefectureGroups(
  groups: readonly PrefectureGroup[],
  visits: VisitBook,
  filter: VisitFilter,
): PrefectureGroup[] {
  if (filter === 'all') return [...groups]
  const wantVisited = filter === 'visited'
  return groups
    .map((g) => ({
      ...g,
      stations: g.stations.filter((s) => isVisited(visits, s.id) === wantVisited),
    }))
    .filter((g) => g.stations.length > 0)
}

/** 制覇した県の数 */
export function completedPrefectureCount(groups: readonly PrefectureGroup[]): number {
  return groups.filter((g) => isCompleted(g.progress)).length
}
