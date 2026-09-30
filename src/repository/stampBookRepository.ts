import type { StampBook } from '../domain/stampBook'
import type { StampRecord } from '../domain/stampRecord'

/**
 * 記録帳の保存・読み込みの窓口。
 * 端末内とクラウドを差し替えられるよう、非同期で城ごとに保存する形にしている。
 */
export interface StampBookRepository {
  load(): Promise<StampBook>
  saveRecord(castleNumber: number, record: StampRecord): Promise<void>
  /**
   * 記録帳が変わるたびに（自分の保存も、共有しているもう 1 人の保存も）新しい記録帳で呼ぶ。
   * 変わっていなくても呼ばれることがある。戻り値の関数で購読をやめる
   */
  subscribe(listener: (book: StampBook) => void): () => void
}

/**
 * 保存データが、このアプリの知らない新しいバージョンだったときのエラー。
 * 古いアプリで上書きして壊さないよう、データには触れずにこのエラーを投げる。
 */
export class UnsupportedVersionError extends Error {
  readonly version: number

  constructor(version: number) {
    super(`保存データのバージョン ${version} に対応していません。アプリを更新してください。`)
    this.name = 'UnsupportedVersionError'
    this.version = version
  }
}
