import { parseShareCode, type ShareCode } from '../domain/shareCode'
import type { MichinoekiVisitRepository } from '../repository/michinoekiVisitRepository'
import type { CloudBookStore } from './cloudBookStore'
import { saveShareSettings } from './shareSettings'

export type JoinResult =
  | { status: 'joined'; code: ShareCode }
  /** 共有コードの形になっていない */
  | { status: 'invalid' }
  /** コードに合う記録帳がない */
  | { status: 'not-found' }

type Options = {
  /** 入力された共有コード（区切りや全角のままでよい） */
  input: string
  cloud: CloudBookStore
  /** 今使っている端末内の道の駅の訪問帳（あれば共有の訪問帳に取り込む） */
  localVisits?: MichinoekiVisitRepository
  /** 共有の設定を保存する先 */
  storage: Storage
}

/**
 * 共有に参加する：コードの記録帳があれば共有の設定を保存する。
 * 端末内の記録には手を付けない（使わなくなるだけで、消さずに残る）。
 * 道の駅の訪問帳は、クラウドにまだ記録がない駅だけ取り込む（端末内の訪問帳も消さずに残る）。
 * クラウドに問い合わせられないときは例外
 */
export async function joinSharing({
  input,
  cloud,
  localVisits,
  storage,
}: Options): Promise<JoinResult> {
  const code = parseShareCode(input)
  if (!code) return { status: 'invalid' }
  if (!(await cloud.exists(code))) return { status: 'not-found' }
  if (localVisits) await cloud.importVisits(code, await localVisits.load())
  saveShareSettings(storage, { code })
  return { status: 'joined', code }
}
