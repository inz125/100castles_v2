import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { michinoeki } from '../domain/michinoeki'
import {
  MICHINOEKI_PREFECTURES,
  type VisitBook,
  type VisitFilter,
} from '../domain/michinoekiVisits'
import { MichinoekiPage } from './MichinoekiPage'

const idsIn = (prefecture: string) =>
  michinoeki.filter((s) => s.prefecture === prefecture).map((s) => s.id)

/** 長野県の駅すべてと、愛知県の最初の駅に行った訪問帳 */
const NAGANO = idsIn('長野県')
const AICHI = idsIn('愛知県')
const visits: VisitBook = {
  ...Object.fromEntries(NAGANO.map((id) => [id, '2026-10-01'])),
  [AICHI[0]]: '2026-09-30',
}
const visitedCount = NAGANO.length + 1

function renderPage(
  book: VisitBook = visits,
  filter: VisitFilter = 'all',
  onFilterChange = vi.fn<(filter: VisitFilter) => void>(),
  onVisitChange = vi.fn<(stationId: number, visited: boolean) => void>(),
) {
  render(
    <MichinoekiPage
      visits={book}
      filter={filter}
      onFilterChange={onFilterChange}
      onVisitChange={onVisitChange}
    />,
  )
  return { onFilterChange, onVisitChange }
}

describe('MichinoekiPage', () => {
  describe('ダッシュボード', () => {
    it('全体の進捗をリングで表示し、数と制覇率を読み上げられる', () => {
      renderPage()
      const percent = Math.floor((visitedCount / michinoeki.length) * 100)
      const ring = screen.getByRole('img', {
        name: `全体 ${visitedCount}/${michinoeki.length}（${percent}%）`,
      })
      expect(ring).toHaveTextContent(new RegExp(`${visitedCount}\\s*/\\s*${michinoeki.length}`))
      expect(ring).toHaveTextContent(`${percent}%`)
    })

    it('制覇率・制覇した県の数・残りの駅の数を表示する', () => {
      renderPage()
      const percent = Math.floor((visitedCount / michinoeki.length) * 100)
      expect(screen.getByText('制覇率').nextElementSibling).toHaveTextContent(`${percent}%`)
      expect(screen.getByText('制覇した県').nextElementSibling).toHaveTextContent('1 / 5')
      expect(screen.getByText('残り').nextElementSibling).toHaveTextContent(
        `${michinoeki.length - visitedCount} 駅`,
      )
    })

    it('県ごとの進捗を、決まった県の順に数と制覇率つきで表示する', () => {
      renderPage()
      const board = screen.getByRole('list', { name: '県ごとの進捗' })
      const labels = within(board)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label'))
      const aichiPercent = Math.floor((1 / AICHI.length) * 100)
      expect(labels).toEqual([
        `愛知県 1/${AICHI.length}（${aichiPercent}%）`,
        `岐阜県 0/${idsIn('岐阜県').length}（0%）`,
        `三重県 0/${idsIn('三重県').length}（0%）`,
        `静岡県 0/${idsIn('静岡県').length}（0%）`,
        `長野県 ${NAGANO.length}/${NAGANO.length}（100%）制覇`,
      ])
    })

    it('制覇した県には「制覇」の印を付ける', () => {
      renderPage()
      const nagano = screen.getByRole('region', { name: /長野県/ })
      expect(within(nagano).getByRole('heading', { level: 2 })).toHaveTextContent('制覇')
      const aichi = screen.getByRole('region', { name: /愛知県/ })
      expect(within(aichi).getByRole('heading', { level: 2 })).not.toHaveTextContent('制覇')
    })

    it('ページの見出し「道の駅」は最上位の見出し（h1）', () => {
      renderPage()
      expect(screen.getByRole('heading', { level: 1, name: '道の駅' })).toBeInTheDocument()
    })

    describe('県をタップしたとき', () => {
      let scrolled: Element[]
      beforeEach(() => {
        scrolled = []
        // jsdom には scrollIntoView がないので、どの要素に対して呼ばれたかを記録する
        Element.prototype.scrollIntoView = vi.fn<(this: Element) => void>(function (this: Element) {
          scrolled.push(this)
        })
      })

      it('その県の見出しまでスクロールする', async () => {
        renderPage()
        await userEvent.click(screen.getByRole('button', { name: /^三重県/ }))
        expect(scrolled).toEqual([screen.getByRole('region', { name: /三重県/ })])
      })

      it('絞り込みで表示されていない県なら、絞り込みを すべて にしてからスクロールする', async () => {
        const onFilterChange = vi.fn<(filter: VisitFilter) => void>()
        const ui = (filter: VisitFilter) => (
          <MichinoekiPage
            visits={visits}
            filter={filter}
            onFilterChange={onFilterChange}
            onVisitChange={() => {}}
          />
        )
        const { rerender } = render(ui('visited'))
        await userEvent.click(screen.getByRole('button', { name: /^三重県/ }))
        expect(onFilterChange).toHaveBeenCalledWith('all')
        expect(scrolled).toEqual([])

        rerender(ui('all'))
        expect(scrolled).toEqual([screen.getByRole('region', { name: /三重県/ })])
      })
    })
  })

  describe('駅の一覧', () => {
    it('県ごとの見出しの下に、すべての駅を行ったかどうかのチェックつきで表示する', () => {
      renderPage({})
      expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(
        MICHINOEKI_PREFECTURES.map((p) => expect.stringContaining(p)),
      )
      expect(screen.getAllByRole('checkbox')).toHaveLength(michinoeki.length)
      expect(
        screen.getAllByRole('checkbox').filter((c) => (c as HTMLInputElement).checked),
      ).toEqual([])
    })

    it('行った駅はチェックが付き、行った日を表示する', () => {
      renderPage()
      const station = michinoeki.find((s) => s.id === AICHI[0])!
      expect(screen.getByRole('checkbox', { name: `道の駅 ${station.name}` })).toBeChecked()
      expect(screen.getByText('2026/09/30 訪問')).toBeInTheDocument()
    })

    it('チェックを切り替えると、その駅と切り替え後の状態を知らせる', async () => {
      const { onVisitChange } = renderPage()
      const station = michinoeki.find((s) => s.id === AICHI[1])!
      await userEvent.click(screen.getByRole('checkbox', { name: `道の駅 ${station.name}` }))
      expect(onVisitChange).toHaveBeenCalledWith(station.id, true)

      const visited = michinoeki.find((s) => s.id === AICHI[0])!
      await userEvent.click(screen.getByRole('checkbox', { name: new RegExp(visited.name) }))
      expect(onVisitChange).toHaveBeenCalledWith(visited.id, false)
    })

    it('未訪問で絞り込むと、行っていない駅だけを表示し、制覇した県は表示しない', () => {
      renderPage(visits, 'unvisited')
      expect(screen.getAllByRole('checkbox')).toHaveLength(michinoeki.length - visitedCount)
      expect(screen.queryByRole('region', { name: /長野県/ })).toBeNull()
    })

    it('訪問済みで絞り込んで該当がなければ、そう表示する', () => {
      renderPage({}, 'visited')
      expect(screen.getByText('該当する道の駅はありません')).toBeInTheDocument()
    })

    it('絞り込みを切り替えられる', async () => {
      const { onFilterChange } = renderPage()
      const group = screen.getByRole('group', { name: '絞り込み' })
      expect(within(group).getByRole('button', { name: 'すべて' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await userEvent.click(within(group).getByRole('button', { name: '訪問済み' }))
      expect(onFilterChange).toHaveBeenCalledWith('visited')
    })
  })
})
