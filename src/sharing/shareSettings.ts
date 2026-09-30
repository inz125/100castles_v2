import { parseShareCode, type ShareCode } from '../domain/shareCode'

/** 共有の設定を覚えておくキー。これがある端末はクラウドの記録帳を使う */
export const SHARE_SETTINGS_STORAGE_KEY = 'castles100.share'

export type ShareSettings = {
  code: ShareCode
}

/** 共有していない・読めないときは null */
export function loadShareSettings(storage: Storage): ShareSettings | null {
  try {
    const raw = storage.getItem(SHARE_SETTINGS_STORAGE_KEY)
    if (raw === null) return null
    const { code } = (JSON.parse(raw) ?? {}) as { code?: unknown }
    // 保存するのは区切りなしの正規化済みのコードだけなので、それ以外は壊れたデータとみなす
    if (typeof code !== 'string' || parseShareCode(code) !== code) return null
    return { code: code as ShareCode }
  } catch {
    return null
  }
}

/**
 * 共有の設定を保存する。
 * 保存できないと次に開いたとき端末内の記録帳に戻って記録が分かれてしまうので、例外はそのまま伝える
 */
export function saveShareSettings(storage: Storage, settings: ShareSettings): void {
  storage.setItem(SHARE_SETTINGS_STORAGE_KEY, JSON.stringify({ code: settings.code }))
}
