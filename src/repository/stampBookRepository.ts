import type { StampBook } from '../domain/stampBook'
import type { StampRecord } from '../domain/stampRecord'

/**
 * 記録帳の保存・読み込みの窓口。
 * 将来クラウド同期に差し替えられるよう、非同期で城ごとに保存する形にしている。
 */
export interface StampBookRepository {
  load(): Promise<StampBook>
  saveRecord(castleNumber: number, record: StampRecord): Promise<void>
}
