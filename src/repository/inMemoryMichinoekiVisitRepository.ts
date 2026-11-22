import type { VisitBook } from '../domain/michinoekiVisits'
import type { IsoDate } from '../domain/stampRecord'
import { BookListeners } from './bookListeners'
import type { MichinoekiVisitRepository } from './michinoekiVisitRepository'

/** メモリ上に保存する実装（テスト用） */
export class InMemoryMichinoekiVisitRepository implements MichinoekiVisitRepository {
  private visits: Record<number, IsoDate> = {}
  private readonly listeners = new BookListeners<VisitBook>()

  async load(): Promise<VisitBook> {
    return { ...this.visits }
  }

  async saveVisit(stationId: number, visitedOn: IsoDate | null): Promise<void> {
    if (visitedOn === null) delete this.visits[stationId]
    else this.visits[stationId] = visitedOn
    this.listeners.notify(this.visits)
  }

  subscribe(listener: (visits: VisitBook) => void): () => void {
    return this.listeners.add(listener)
  }
}
