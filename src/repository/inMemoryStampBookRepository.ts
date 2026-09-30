import type { StampBook } from '../domain/stampBook'
import type { StampRecord } from '../domain/stampRecord'
import { BookListeners } from './bookListeners'
import type { StampBookRepository } from './stampBookRepository'

/** メモリ上に保存する実装（テスト用） */
export class InMemoryStampBookRepository implements StampBookRepository {
  private book: Record<number, StampRecord> = {}
  private readonly listeners = new BookListeners()

  async load(): Promise<StampBook> {
    return structuredClone(this.book)
  }

  async saveRecord(castleNumber: number, record: StampRecord): Promise<void> {
    this.book[castleNumber] = { ...record }
    this.listeners.notify(this.book)
  }

  subscribe(listener: (book: StampBook) => void): () => void {
    return this.listeners.add(listener)
  }
}
