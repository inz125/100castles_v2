import type { StampBook } from '../domain/stampBook'

type Listener = (book: StampBook) => void

/** 記録帳の変更を購読している相手の一覧（Repository の実装で共通に使う） */
export class BookListeners {
  private readonly listeners = new Set<Listener>()

  /** 購読する。戻り値の関数で購読をやめる */
  add(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** 新しい記録帳を知らせる（相手ごとに複製を渡し、書き換えられても保存内容に響かないようにする） */
  notify(book: StampBook): void {
    for (const listener of this.listeners) listener(structuredClone(book))
  }
}
