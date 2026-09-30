import type { ShareCode } from '../domain/shareCode'
import type { StampBook } from '../domain/stampBook'
import type { StampBookRepository } from '../repository/stampBookRepository'

/** クラウドにある共有の記録帳の窓口（Firebase の実装はこの裏に隠す） */
export interface CloudBookStore {
  /** 共有コードで新しい記録帳を作り、渡した記録を入れる。同じコードがあれば BookAlreadyExistsError */
  create(code: ShareCode, book: StampBook): Promise<void>
  /** 共有コードの記録帳があるか */
  exists(code: ShareCode): Promise<boolean>
  /** 共有コードの記録帳を開く */
  open(code: ShareCode): CloudBookRepository
}

/** クラウドの記録帳。端末内の記録帳と同じ使い方に加え、送信待ちの変更があるかを知らせる */
export interface CloudBookRepository extends StampBookRepository {
  /**
   * まだクラウドに届いていない変更があるか（電波がないときに保存した変更など）を、変わるたびに知らせる。
   * 戻り値の関数で購読をやめる
   */
  subscribePendingWrites(listener: (pending: boolean) => void): () => void
}

/** 作ろうとした共有コードの記録帳がすでにあった */
export class BookAlreadyExistsError extends Error {
  constructor() {
    super('この共有コードの記録帳はすでにあります')
    this.name = 'BookAlreadyExistsError'
  }
}
