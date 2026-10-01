import { NavLink, useLocation } from 'react-router'
import { scrollBehavior } from './motion'

const TABS = [
  { to: '/', label: '一覧' },
  { to: '/nearby', label: '近く' },
  { to: '/map', label: '地図' },
] as const

/**
 * 画面下部のタブバー。開いているタブには aria-current="page" がつく。
 * 開いているタブをもう一度押すと、画面の一番上までスクロールする。
 */
export function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav className="tab-bar" aria-label="タブ">
      {TABS.map(({ to, label }) => (
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
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
