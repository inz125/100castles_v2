import { generateShareCode, type ShareCode } from '../domain/shareCode'
import type { StampBookRepository } from '../repository/stampBookRepository'
import { BookAlreadyExistsError, type CloudBookStore } from './cloudBookStore'
import { saveShareSettings } from './shareSettings'

/** コードがぶつかったときに作り直す回数の上限（約 59 ビットあるので実際にはまず起きない） */
const MAX_ATTEMPTS = 3

type Options = {
  /** 今使っている端末内の記録帳 */
  local: StampBookRepository
  cloud: CloudBookStore
  /** 共有の設定を保存する先 */
  storage: Storage
  generateCode?: () => ShareCode
}

/**
 * 共有を始める：端末の記録をすべて入れた記録帳をクラウドに作り、共有の設定を保存する。
 * 端末内の記録は消さずに残す。失敗したときは共有の設定を保存しない（端末内の記録帳のまま）
 */
export async function startSharing({
  local,
  cloud,
  storage,
  generateCode = () => generateShareCode(),
}: Options): Promise<ShareCode> {
  const book = await local.load()
  for (let attempt = 1; ; attempt++) {
    const code = generateCode()
    try {
      await cloud.create(code, book)
    } catch (error) {
      if (error instanceof BookAlreadyExistsError && attempt < MAX_ATTEMPTS) continue
      throw error
    }
    saveShareSettings(storage, { code })
    return code
  }
}
