import type { VisitBook } from '../domain/michinoekiVisits'
import type { IsoDate } from '../domain/stampRecord'

/**
 * 道の駅の訪問帳の保存・読み込みの窓口（城の記録帳とは別に持つ）。
 * あとでクラウドにも置けるよう、城の記録帳と同じく非同期で駅ごとに保存する形にしている
 */
export interface MichinoekiVisitRepository {
  load(): Promise<VisitBook>
  /** 行った日を保存する。null なら行っていないことにする */
  saveVisit(stationId: number, visitedOn: IsoDate | null): Promise<void>
  /**
   * 訪問帳が変わるたびに（自分の保存も、共有しているもう 1 人の保存も）新しい訪問帳で呼ぶ。
   * 変わっていなくても呼ばれることがある。戻り値の関数で購読をやめる
   */
  subscribe(listener: (visits: VisitBook) => void): () => void
}
