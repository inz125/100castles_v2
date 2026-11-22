import type { ShareCode } from '../domain/shareCode'
import { visitsToImport, type VisitBook } from '../domain/michinoekiVisits'
import type { StampBook } from '../domain/stampBook'
import type { IsoDate, StampRecord } from '../domain/stampRecord'
import { BookListeners } from '../repository/bookListeners'
import {
  BookAlreadyExistsError,
  type CloudBookRepository,
  type CloudBookStore,
  type CloudVisitRepository,
} from './cloudBookStore'

type SharedBook = {
  records: Record<number, StampRecord>
  /** この記録帳を開いているすべての端末 */
  listeners: BookListeners
  /** 駅の番号 → 行った日（行っていないことにした駅は null で残る。クラウドの記録は削除しないため） */
  visits: Record<number, IsoDate | null>
  visitListeners: BookListeners<VisitBook>
  pendingWrites: boolean
  pendingListeners: Set<(pending: boolean) => void>
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

  /** 送信待ちの状態を変える（テスト用。メモリ上では保存がすぐ届くので、送信待ちを再現するときに使う） */
  setPendingWrites(code: ShareCode, pending: boolean): void {
    const shared = this.bookOf(code)
    shared.pendingWrites = pending
    for (const listener of shared.pendingListeners) listener(pending)
  }

  open(code: ShareCode): CloudBookRepository {
    const shared = this.bookOf(code)
    return {
      load: async () => structuredClone(shared.records),
      saveRecord: async (castleNumber, record) => {
        shared.records[castleNumber] = { ...record }
        shared.listeners.notify(shared.records)
      },
      subscribe: (listener) => shared.listeners.add(listener),
      subscribePendingWrites: (listener) => this.subscribePending(shared, listener),
    }
  }

  openVisits(code: ShareCode): CloudVisitRepository {
    const shared = this.bookOf(code)
    return {
      load: async () => visitBookOf(shared),
      saveVisit: async (stationId, visitedOn) => {
        shared.visits[stationId] = visitedOn
        shared.visitListeners.notify(visitBookOf(shared))
      },
      subscribe: (listener) => shared.visitListeners.add(listener),
      subscribePendingWrites: (listener) => this.subscribePending(shared, listener),
    }
  }

  async importVisits(code: ShareCode, visits: VisitBook): Promise<void> {
    const shared = this.bookOf(code)
    const known = new Set(Object.keys(shared.visits).map(Number))
    Object.assign(shared.visits, visitsToImport(visits, known))
    shared.visitListeners.notify(visitBookOf(shared))
  }

  private subscribePending(shared: SharedBook, listener: (pending: boolean) => void) {
    shared.pendingListeners.add(listener)
    listener(shared.pendingWrites)
    return () => {
      shared.pendingListeners.delete(listener)
    }
  }

  private bookOf(code: ShareCode): SharedBook {
    let shared = this.books.get(code)
    if (!shared) {
      shared = {
        records: {},
        listeners: new BookListeners(),
        visits: {},
        visitListeners: new BookListeners<VisitBook>(),
        pendingWrites: false,
        pendingListeners: new Set(),
      }
      this.books.set(code, shared)
    }
    return shared
  }
}

/** 行った駅だけの訪問帳（null の駅は除く） */
function visitBookOf(shared: SharedBook): VisitBook {
  return Object.fromEntries(
    Object.entries(shared.visits).filter(([, visitedOn]) => visitedOn !== null),
  ) as VisitBook
}
