/**
 * 地図の道の駅のピン。道の駅の標識（青い角丸に、木と、人のいる家と、地面）に似せて、
 * 小さく描いても分かるよう細部を省いて描く
 */
export function StationPinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <rect width="100" height="100" rx="12" fill="#2323c9" />
      <g fill="#fff">
        {/* 木（2 本） */}
        <path d="M24 12 C32 20 33 46 31 66 L17 66 C15 46 17 20 24 12 Z" />
        <path d="M40 22 C48 30 49 52 47 70 L33 70 C31 52 33 30 40 22 Z" />
        {/* 地面 */}
        <rect x="10" y="68" width="82" height="12" rx="3" />
        {/* 人 */}
        <circle cx="68" cy="46" r="6" />
        <path d="M60 54 L76 54 L76 72 L60 72 Z" />
      </g>
      {/* 家（屋根と壁） */}
      <path
        d="M52 40 L68 24 L84 40 M57 36 L57 68 M79 36 L79 68"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
