import { useEffect, type CSSProperties } from 'react'
import type { StampEffect } from '../domain/stampBook'

/** 地方を制覇したときの演出を出しておく時間 */
export const REGION_CELEBRATION_MS = 2600

/** 押印したときの演出を出しておく時間 */
export const STAMP_EFFECT_MS = 1400

type Props = {
  effect: StampEffect
  onDismiss: () => void
}

/**
 * 制覇の演出。タップで消せる。
 * 地方：朱印が押され、少し経つと消える。
 * 押印：その城の小さな朱印が押され、すぐに消える。
 * 100 城：大きな朱印が押されて桜の花びらが舞い、タップするまで残る。
 */
export function Celebration({ effect, onDismiss }: Props) {
  const isAll = effect.kind === 'all'

  useEffect(() => {
    if (isAll) return
    const ms = effect.kind === 'stamp' ? STAMP_EFFECT_MS : REGION_CELEBRATION_MS
    const timer = setTimeout(onDismiss, ms)
    return () => clearTimeout(timer)
  }, [isAll, effect.kind, onDismiss])

  if (effect.kind === 'stamp') {
    return (
      <div role="status" className="celebration celebration--stamp" onClick={onDismiss}>
        <div className="celebration__seal">
          <span className="celebration__name">{effect.castleName}</span>
          <span className="celebration__title">押印</span>
        </div>
      </div>
    )
  }

  return (
    <div role="status" className={`celebration celebration--${effect.kind}`} onClick={onDismiss}>
      {isAll && <Petals />}
      <div className="celebration__seal">
        <span className="celebration__name">
          {effect.kind === 'region' ? (
            effect.region
          ) : (
            <>
              日本<span className="celebration__digits">100</span>名城
            </>
          )}
        </span>
        <span className="celebration__title">制覇</span>
      </div>
      {isAll && <p className="celebration__hint">タップで閉じる</p>}
    </div>
  )
}

const PETAL_COUNT = 28

/** 舞い落ちる桜の花びら。位置や速さは番号から決め、描くたびに変わらないようにする */
function Petals() {
  return (
    <div className="petals" aria-hidden="true">
      {Array.from({ length: PETAL_COUNT }, (_, i) => (
        <span
          key={i}
          className="petal"
          style={
            {
              '--x': `${(i * 37) % 100}%`,
              '--delay': `${((i * 7) % 20) / 4}s`,
              '--duration': `${6 + ((i * 5) % 5)}s`,
              '--drift': `${((i * 13) % 9) * 10 - 40}px`,
              '--size': `${10 + ((i * 3) % 7)}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
