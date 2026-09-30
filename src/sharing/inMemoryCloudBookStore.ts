import type { ShareCode } from '../domain/shareCode'
import type { StampBook } from '../domain/stampBook'
import type { StampRecord } from '../domain/stampRecord'
import { BookListeners } from '../repository/bookListeners'
import type { StampBookRepository } from '../repository/stampBookRepository'
import { BookAlreadyExistsError, type CloudBookStore } from './cloudBookStore'

type SharedBook = {
  records: Record<number, StampRecord>
  /** この記録帳を開いているすべての端末 */
  listeners: BookListeners
}

/** メモリ上のクラウド（テスト用）。同じコードで開いた記録帳どうしは中身を共有する */
export class InMemoryCloudBookStore implements CloudBookStore {
  private readonly books = new Map<ShareCode, SharedBook>()
  private readonly created = new Set<ShareCode>()

  async create(code: ShareCode, book: StampBook): Promise<void> {
    if (this.created.has(code)) throw new BookAlreadyExistsError()
    this.created.add(code)
    const shared = this.bookOf(code)
    shared.records = structuredClone(book) as Record<number, StampRecord>
    shared.listeners.notify(shared.records)
  }

  async exists(code: ShareCode): Promise<boolean> {
    return this.created.has(code)
  }

  open(code: ShareCode): StampBookRepository {
    const shared = this.bookOf(code)
    return {
      load: async () => structuredClone(shared.records),
      saveRecord: async (castleNumber, record) => {
        shared.records[castleNumber] = { ...record }
        shared.listeners.notify(shared.records)
      },
      subscribe: (listener) => shared.listeners.add(listener),
    }
  }

  private bookOf(code: ShareCode): SharedBook {
    let shared = this.books.get(code)
    if (!shared) {
      shared = { records: {}, listeners: new BookListeners() }
      this.books.set(code, shared)
    }
    return shared
  }
}
