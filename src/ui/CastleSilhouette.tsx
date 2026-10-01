/** 天守のシルエット（飾り。石垣の上に三重の屋根） */
export function CastleSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true" focusable="false">
      <g fill="currentColor">
        {/* 石垣 */}
        <path d="M36 120 L164 120 L150 90 L50 90 Z" />
        {/* 一重目 */}
        <rect x="62" y="72" width="76" height="18" />
        <path d="M44 80 Q58 76 64 64 L136 64 Q142 76 156 80 Z" />
        {/* 二重目 */}
        <rect x="74" y="50" width="52" height="14" />
        <path d="M60 56 Q72 52 76 42 L124 42 Q128 52 140 56 Z" />
        <path d="M86 44 L100 33 L114 44 Z" />
        {/* 最上階 */}
        <rect x="85" y="26" width="30" height="16" />
        <path d="M72 32 Q84 28 88 18 L112 18 Q116 28 128 32 Z" />
        {/* 大棟と鯱 */}
        <rect x="90" y="14" width="20" height="4" />
        <path d="M88 18 L90 9 L94 14 Z M112 18 L110 9 L106 14 Z" />
      </g>
    </svg>
  )
}
