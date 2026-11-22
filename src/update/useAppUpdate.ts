import { useEffect, useState } from 'react'
import type { AppUpdater } from './AppUpdater'

/** 開いている間に新しい版を確認する間隔（D-08） */
export const CHECK_INTERVAL_MS = 60 * 60 * 1000

/**
 * 新しい版の確認と反映（D-08）。前面に戻ったときと 1 時間ごとに確認する。
 * 書きかけの内容を失わないよう、自動では再読み込みせず、ポップアップを出すかどうか（prompt）を返す。
 * 「あとで」（later）で閉じたら開いている間は出さず、次に前面に戻ったときに出し直す
 */
export function useAppUpdate(updater: AppUpdater) {
  // none: 見つかっていない / shown: ポップアップを出す / later: 見つかったが「あとで」で閉じた
  const [state, setState] = useState<'none' | 'shown' | 'later'>('none')

  useEffect(
    () => updater.onNeedRefresh(() => setState((s) => (s === 'none' ? 'shown' : s))),
    [updater],
  )

  useEffect(() => {
    // 電波がないときは確認しない。失敗しても何も表示しない
    const check = () => {
      if (navigator.onLine) updater.check().catch(() => {})
    }
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      // Service Worker は待機中の版について onNeedRefresh を呼び直さないことがあるので、ここで出し直す
      setState((s) => (s === 'later' ? 'shown' : s))
      check()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    const timer = setInterval(check, CHECK_INTERVAL_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearInterval(timer)
    }
  }, [updater])

  return {
    prompt: state === 'shown',
    apply: () => updater.apply(),
    later: () => setState('later'),
  }
}
