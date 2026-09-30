import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'

/** 詳細画面を開ける画面と、「戻る」の文言 */
const BACK_TARGETS = {
  '/': '一覧に戻る',
  '/nearby': '近くに戻る',
  '/map': '地図に戻る',
} as const

type BackTarget = keyof typeof BACK_TARGETS

/** 詳細画面へ渡す location.state */
type DetailState = { from: BackTarget }

const isBackTarget = (value: unknown): value is BackTarget =>
  typeof value === 'string' && Object.hasOwn(BACK_TARGETS, value)

type CastleLinkProps = {
  castleNumber: number
  className?: string
  children: ReactNode
}

/** 詳細画面へのリンク。「戻る」で戻れるように、今いる画面を伝える */
export function CastleLink({ castleNumber, className, children }: CastleLinkProps) {
  const { pathname } = useLocation()
  const state: DetailState | undefined = isBackTarget(pathname) ? { from: pathname } : undefined
  return (
    <Link to={`/castles/${castleNumber}`} state={state} className={className}>
      {children}
    </Link>
  )
}

/** 詳細画面の「戻る」。開く前の画面へ戻る（URL で直接開いたときなどは一覧へ） */
export function BackLink() {
  const { state } = useLocation()
  const from: unknown = (state as Partial<DetailState> | null)?.from
  const to = isBackTarget(from) ? from : '/'
  return (
    <Link to={to} className="back-link">
      {BACK_TARGETS[to]}
    </Link>
  )
}
