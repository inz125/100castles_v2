import type { ReactNode } from 'react'
import { isCompleted, percentOf, type Progress } from '../domain/stampBook'

type Props = {
  /** 読み上げ用の名前（例：全体、近畿） */
  label: string
  progress: Progress
  className?: string
  /** リングの中央に重ねる内容（読み上げは label と進捗で行うので、見た目だけ） */
  children?: ReactNode
}

/** 押印済みの割合を朱色で塗る円形の進捗 */
export function ProgressRing({ label, progress, className, children }: Props) {
  const ratio = progress.total === 0 ? 0 : (progress.stamped / progress.total) * 100
  const completed = isCompleted(progress)

  return (
    <div
      role="img"
      aria-label={`${label} ${progress.stamped}/${progress.total}（${percentOf(progress)}%）${completed ? '制覇' : ''}`}
      className={['progress-ring', completed && 'progress-ring--completed', className]
        .filter(Boolean)
        .join(' ')}
    >
      <svg viewBox="0 0 100 100" className="progress-ring__svg" aria-hidden="true">
        <circle className="progress-ring__track" cx="50" cy="50" r="44" />
        {/* 0 のときに描くと、線の丸い端だけが点として残るので描かない */}
        {ratio > 0 && (
          <circle
            className="progress-ring__fill"
            cx="50"
            cy="50"
            r="44"
            pathLength={100}
            strokeDasharray={`${ratio} 100`}
          />
        )}
      </svg>
      {children && (
        <div className="progress-ring__center" aria-hidden="true">
          {children}
        </div>
      )}
    </div>
  )
}
