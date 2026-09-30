import type { Castle } from './castles'
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
