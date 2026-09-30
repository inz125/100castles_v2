import type { StampFilter } from '../domain/stampBook'

/** 絞り込みの選択を覚えておく場所と、保存がないときの初期値 */
export type FilterPreference = {
  key: string
  fallback: StampFilter
}

// 表示の好みなので記録帳とは別に保存する
/** 一覧タブ */
export const LIST_FILTER: FilterPreference = { key: 'castles100.filter', fallback: 'all' }
/** 近くタブ（これから行く城を探すので未押印から） */
export const NEARBY_FILTER: FilterPreference = {
  key: 'castles100.nearbyFilter',
  fallback: 'unstamped',
}

const FILTERS: readonly string[] = ['all', 'unstamped', 'stamped'] satisfies StampFilter[]

export function loadStampFilter(
  storage: Storage,
  { key, fallback }: FilterPreference,
): StampFilter {
  try {
    const saved = storage.getItem(key)
    return saved !== null && FILTERS.includes(saved) ? (saved as StampFilter) : fallback
  } catch {
    return fallback
  }
}

export function saveStampFilter(
  storage: Storage,
  { key }: FilterPreference,
  filter: StampFilter,
): void {
  try {
    storage.setItem(key, filter)
  } catch {
    // 保存できなくても表示には困らないので無視する
  }
}
