import { parseShareCode, type ShareCode } from '../domain/shareCode'
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
  /** 共有の設定を保存する先 */
  storage: Storage
}

/**
 * 共有に参加する：コードの記録帳があれば共有の設定を保存する。
 * 端末内の記録には手を付けない（使わなくなるだけで、消さずに残る）。
 * クラウドに問い合わせられないときは例外
 */
export async function joinSharing({ input, cloud, storage }: Options): Promise<JoinResult> {
  const code = parseShareCode(input)
  if (!code) return { status: 'invalid' }
  if (!(await cloud.exists(code))) return { status: 'not-found' }
  saveShareSettings(storage, { code })
  return { status: 'joined', code }
}
