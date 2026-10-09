/** 地図のピン用の天守（小さく描いても形が分かるよう、細部を省いた二重の天守） */
export function CastlePinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <g fill="currentColor">
        {/* 石垣 */}
        <path d="M8 96 L92 96 L84 68 L16 68 Z" />
        {/* 一重目 */}
        <rect x="26" y="50" width="48" height="18" />
        <path d="M10 56 L90 56 L76 42 L24 42 Z" />
        {/* 最上階 */}
        <rect x="36" y="30" width="28" height="12" />
        <path d="M22 34 L78 34 L62 14 L38 14 Z" />
      </g>
    </svg>
  )
}
