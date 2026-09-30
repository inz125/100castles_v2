import { NavLink } from 'react-router'

const TABS = [
  { to: '/', label: '一覧' },
  { to: '/nearby', label: '近く' },
  { to: '/map', label: '地図' },
] as const

/** 画面下部のタブバー。開いているタブには aria-current="page" がつく */
export function TabBar() {
  return (
    <nav className="tab-bar" aria-label="タブ">
      {TABS.map(({ to, label }) => (
        // end：「一覧」（/）が他のタブや詳細画面で選択状態にならないようにする
        <NavLink key={to} to={to} end className="tab-bar__tab">
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
