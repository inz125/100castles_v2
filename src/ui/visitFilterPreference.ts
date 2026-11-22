import type { VisitFilter } from '../domain/michinoekiVisits'

/** 道の駅タブの絞り込みを覚えておくキー（表示の好みなので訪問帳とは別に保存する） */
export const VISIT_FILTER_STORAGE_KEY = 'castles100.michinoekiFilter'

const FILTERS: readonly string[] = ['all', 'unvisited', 'visited'] satisfies VisitFilter[]

/** 保存がない・読めないときは すべて */
export function loadVisitFilter(storage: Storage): VisitFilter {
  try {
    const saved = storage.getItem(VISIT_FILTER_STORAGE_KEY)
    return saved !== null && FILTERS.includes(saved) ? (saved as VisitFilter) : 'all'
  } catch {
    return 'all'
  }
}

export function saveVisitFilter(storage: Storage, filter: VisitFilter): void {
  try {
    storage.setItem(VISIT_FILTER_STORAGE_KEY, filter)
  } catch {
    // 保存できなくても表示には困らないので無視する
  }
}
