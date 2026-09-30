import type { StampFilter } from '../domain/stampBook'

/** 一覧の絞り込みの選択を覚えておくキー（表示の好みなので記録帳とは別に保存する） */
export const FILTER_STORAGE_KEY = 'castles100.filter'

const FILTERS: readonly string[] = ['all', 'unstamped', 'stamped'] satisfies StampFilter[]

export function loadStampFilter(storage: Storage): StampFilter {
  try {
    const saved = storage.getItem(FILTER_STORAGE_KEY)
    return saved !== null && FILTERS.includes(saved) ? (saved as StampFilter) : 'all'
  } catch {
    return 'all'
  }
}

export function saveStampFilter(storage: Storage, filter: StampFilter): void {
  try {
    storage.setItem(FILTER_STORAGE_KEY, filter)
  } catch {
    // 保存できなくても表示には困らないので無視する
  }
}
