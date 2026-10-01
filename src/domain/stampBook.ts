import { castles, REGIONS, type Castle, type Region } from './castles'
import { createEmptyRecord, isStamped, type StampRecord } from './stampRecord'

/**
 * 記録帳：城の番号 → 記録。
 * 記録がない城は未押印として扱う（保存データを小さく保ち、城ごとに同期しやすくするため）。
 */
export type StampBook = Readonly<Partial<Record<number, StampRecord>>>

export type Progress = {
  stamped: number
  total: number
}

export function getRecord(book: StampBook, castleNumber: number): StampRecord {
  return book[castleNumber] ?? createEmptyRecord()
}

/** 渡された城のうち、押印済みの数と全体の数 */
export function progressOf(targets: readonly Castle[], book: StampBook): Progress {
  const stamped = targets.filter((c) => isStamped(getRecord(book, c.number))).length
  return { stamped, total: targets.length }
}

/** 制覇した（対象の城をすべて押印した）か */
export function isCompleted(progress: Progress): boolean {
  return progress.total > 0 && progress.stamped === progress.total
}

export type RegionGroup = {
  region: Region
  castles: readonly Castle[]
  progress: Progress
}

/** 城を地方ごとにまとめる（地方は REGIONS の順、城は番号順） */
export function groupByRegion(targets: readonly Castle[], book: StampBook): RegionGroup[] {
  return REGIONS.map((region) => {
    const inRegion = targets
      .filter((c) => c.region === region)
      .toSorted((a, b) => a.number - b.number)
    return { region, castles: inRegion, progress: progressOf(inRegion, book) }
  })
}

export type StampFilter = 'all' | 'unstamped' | 'stamped'

/** 城を押印の状態で絞り込む（並び順はそのまま） */
export function filterCastles<T extends Castle>(
  targets: readonly T[],
  book: StampBook,
  filter: StampFilter,
): T[] {
  if (filter === 'all') return [...targets]
  const wantStamped = filter === 'stamped'
  return targets.filter((c) => isStamped(getRecord(book, c.number)) === wantStamped)
}

/**
 * 地方ごとの城を絞り込む。城が残らない地方は除く。
 * 地方の進捗は絞り込み前（地方全体）のまま残す。
 */
export function filterGroups(
  groups: readonly RegionGroup[],
  book: StampBook,
  filter: StampFilter,
): RegionGroup[] {
  if (filter === 'all') return [...groups]
  return groups
    .map((g) => ({ ...g, castles: filterCastles(g.castles, book, filter) }))
    .filter((g) => g.castles.length > 0)
}

/** 押印して揃ったもの：地方の制覇、または 100 城の制覇 */
export type Completion = { kind: 'region'; region: Region } | { kind: 'all' }

/**
 * 城の記録を next に変えたことで揃ったもの。揃わなければ null。
 * 未押印から押印済みにしたときだけ判定する（押印日の変更などでは揃ったことにしない）。
 * 地方と 100 城が同時に揃ったときは 100 城を返す。
 */
export function completionByStamping(
  book: StampBook,
  castleNumber: number,
  next: StampRecord,
): Completion | null {
  if (isStamped(getRecord(book, castleNumber)) || !isStamped(next)) return null
  const nextBook: StampBook = { ...book, [castleNumber]: next }
  if (isCompleted(progressOf(castles, nextBook))) return { kind: 'all' }
  const castle = castles.find((c) => c.number === castleNumber)
  if (!castle) return null
  const inRegion = castles.filter((c) => c.region === castle.region)
  return isCompleted(progressOf(inRegion, nextBook))
    ? { kind: 'region', region: castle.region }
    : null
}
