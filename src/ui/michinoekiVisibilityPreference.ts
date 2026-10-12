/** 地図に道の駅を出すかどうかを覚えておくキー（表示の好みなので記録帳とは別に保存する） */
export const MICHINOEKI_VISIBLE_STORAGE_KEY = 'castles100.michinoekiVisible'

/** 保存がない・読めないときは表示する */
export function loadMichinoekiVisible(storage: Storage): boolean {
  try {
    return storage.getItem(MICHINOEKI_VISIBLE_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function saveMichinoekiVisible(storage: Storage, visible: boolean): void {
  try {
    storage.setItem(MICHINOEKI_VISIBLE_STORAGE_KEY, String(visible))
  } catch {
    // 保存できなくても地図は使えるので無視する
  }
}
