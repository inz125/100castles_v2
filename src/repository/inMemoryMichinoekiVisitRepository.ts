import type { VisitBook } from '../domain/michinoekiVisits'
import type { IsoDate } from '../domain/stampRecord'
import type { MichinoekiVisitRepository } from './michinoekiVisitRepository'

/** メモリ上に保存する実装（テスト用） */
export class InMemoryMichinoekiVisitRepository implements MichinoekiVisitRepository {
  private visits: Record<number, IsoDate> = {}

  async load(): Promise<VisitBook> {
    return { ...this.visits }
  }

  async saveVisit(stationId: number, visitedOn: IsoDate | null): Promise<void> {
    if (visitedOn === null) delete this.visits[stationId]
    else this.visits[stationId] = visitedOn
  }
}
