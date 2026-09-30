import { REGIONS, type Castle, type Region } from './castles'
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
