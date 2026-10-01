import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { scrollBehavior } from './motion'

const TABS = [
  {
    to: '/',
    label: '一覧',
    // 押印したスタンプ帳
    icon: (
      <>
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z" />
        <path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v3H7.5" />
        <circle cx="12.5" cy="10" r="3" />
      </>
    ),
  },
  {
    to: '/nearby',
    label: '近く',
    // 現在地のピン
    icon: (
      <>
        <path d="M12 21.5s-6.5-5.8-6.5-11.5a6.5 6.5 0 0 1 13 0c0 5.7-6.5 11.5-6.5 11.5z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  },
  {
    to: '/map',
    label: '地図',
    // 折りたたんだ地図
    icon: (
      <>
        <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </>
    ),
  },
] as const satisfies readonly { to: string; label: string; icon: ReactNode }[]

/**
 * 画面下部のタブバー。開いているタブには aria-current="page" がつく。
 * 開いているタブをもう一度押すと、画面の一番上までスクロールする。
 */
export function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav className="tab-bar" aria-label="タブ">
      {TABS.map(({ to, label, icon }) => (
        // end：「一覧」（/）が他のタブや詳細画面で選択状態にならないようにする
        <NavLink
          key={to}
          to={to}
          end
          className="tab-bar__tab"
          onClick={() => {
            if (pathname === to) window.scrollTo({ top: 0, behavior: scrollBehavior() })
          }}
        >
          <svg viewBox="0 0 24 24" className="tab-bar__icon" aria-hidden="true" focusable="false">
            {icon}
          </svg>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
