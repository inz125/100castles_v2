import { useEffect } from 'react'
import type { Completion } from '../domain/stampBook'

/** 地方を制覇したときの演出を出しておく時間 */
export const REGION_CELEBRATION_MS = 2600

type Props = {
  completion: Completion
  onDismiss: () => void
}

/** 制覇の演出。地方は朱印が押されて少し経つと消え、タップでも消せる */
export function Celebration({ completion, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, REGION_CELEBRATION_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const name = completion.kind === 'region' ? completion.region : '日本100名城'

  return (
    <div role="status" className="celebration" onClick={onDismiss}>
      <div className="celebration__seal">
        <span className="celebration__name">{name}</span>
        <span className="celebration__title">制覇</span>
      </div>
    </div>
  )
}
