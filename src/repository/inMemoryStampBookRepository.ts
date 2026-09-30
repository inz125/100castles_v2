import type { StampBook } from '../domain/stampBook'
import type { StampRecord } from '../domain/stampRecord'
import type { StampBookRepository } from './stampBookRepository'

/** メモリ上に保存する実装（テスト用） */
export class InMemoryStampBookRepository implements StampBookRepository {
  private book: Record<number, StampRecord> = {}

  async load(): Promise<StampBook> {
    return structuredClone(this.book)
  }

  async saveRecord(castleNumber: number, record: StampRecord): Promise<void> {
    this.book[castleNumber] = { ...record }
  }
}
