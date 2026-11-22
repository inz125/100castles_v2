import type { StampBook } from '../domain/stampBook'

/** 記録帳（または訪問帳）の変更を購読している相手の一覧（Repository の実装で共通に使う） */
export class BookListeners<T = StampBook> {
  private readonly listeners = new Set<(book: T) => void>()

  /** 購読する。戻り値の関数で購読をやめる */
  add(listener: (book: T) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** 新しい記録帳を知らせる（相手ごとに複製を渡し、書き換えられても保存内容に響かないようにする） */
  notify(book: T): void {
    for (const listener of this.listeners) listener(structuredClone(book))
  }
}
