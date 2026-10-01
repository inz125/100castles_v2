import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { castles, REGIONS } from '../domain/castles'
import type { StampBook, StampFilter } from '../domain/stampBook'
import { CastleListPage } from './CastleListPage'

function renderPage(
  book: StampBook,
  filter: StampFilter = 'all',
  onFilterChange = vi.fn<(filter: StampFilter) => void>(),
) {
  render(
    <MemoryRouter>
      <CastleListPage book={book} filter={filter} onFilterChange={onFilterChange} />
    </MemoryRouter>,
  )
  return { onFilterChange }
}

/** 城の行（詳細画面へのリンクを持つ項目） */
function castleItems() {
  return screen.queryAllByRole('listitem').filter((li) => within(li).queryByRole('link'))
}

describe('CastleListPage', () => {
  it('各城は詳細画面へのリンクになっている', () => {
    renderPage({})
    expect(screen.getByRole('link', { name: /姫路城/ })).toHaveAttribute('href', '/castles/59')
  })

  it('6 地方の見出しをスタンプ帳の順に表示する', () => {
    renderPage({})
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual(
      REGIONS.map((region) => expect.stringContaining(region)),
    )
  })

  it('100 城を表示する', () => {
    renderPage({})
    expect(castleItems()).toHaveLength(100)
  })

  it('各地方の中に、その地方の城を番号・城名・都道府県つきで番号順に表示する', () => {
    renderPage({})
    const kinki = screen.getByRole('region', { name: /近畿/ })
    const items = within(kinki).getAllByRole('listitem')
    expect(items).toHaveLength(14)
    expect(items[0]).toHaveTextContent(/49.*小谷城.*滋賀県/)
    expect(items[10]).toHaveTextContent(/59.*姫路城.*兵庫県/)
    expect(items[13]).toHaveTextContent(/62.*和歌山城.*和歌山県/)
  })

  describe('進捗', () => {
    const book: StampBook = {
      2: { stampedOn: '2026-01-01', memo: '' },
      8: { stampedOn: '2026-01-02', memo: '' },
      59: { stampedOn: '2026-09-30', memo: '' },
      100: { stampedOn: null, memo: 'メモだけ' },
    }

    it('全体の進捗をリングで表示し、数と達成率を読み上げられる', () => {
      renderPage(book)
      const ring = screen.getByRole('img', { name: '全体 3/100（3%）' })
      expect(ring).toHaveTextContent(/3\s*\/\s*100/)
      expect(ring).toHaveTextContent('3%')
    })

    it('地方ごとの進捗を小さなリングで、スタンプ帳の順に表示する', () => {
      renderPage(book)
      const list = screen.getByRole('list', { name: '地方ごとの進捗' })
      expect(
        within(list)
          .getAllByRole('img')
          .map((ring) => ring.getAttribute('aria-label')),
      ).toEqual([
        '北海道・東北 2/13（15%）',
        '関東・甲信越 0/19（0%）',
        '北陸・東海 0/16（0%）',
        '近畿 1/14（7%）',
        '中国・四国 0/22（0%）',
        '九州・沖縄 0/16（0%）',
      ])
    })

    it('制覇した地方のリングは「制覇」の印になる', () => {
      const allTohoku: StampBook = Object.fromEntries(
        castles
          .filter((c) => c.region === '北海道・東北')
          .map((c) => [c.number, { stampedOn: '2026-01-01', memo: '' }]),
      )
      renderPage(allTohoku)
      const list = screen.getByRole('list', { name: '地方ごとの進捗' })
      const tohoku = within(list).getByRole('img', { name: /^北海道・東北/ })
      expect(tohoku).toHaveAccessibleName('北海道・東北 13/13（100%）制覇')
      expect(tohoku).toHaveTextContent('制覇')
      expect(within(list).getByRole('img', { name: /^近畿/ })).not.toHaveTextContent('制覇')
    })

    it('地方の見出しに地方ごとの進捗を表示する', () => {
      renderPage(book)
      const headings = screen.getAllByRole('heading', { level: 2 })
      expect(headings.map((h) => h.textContent)).toEqual([
        '北海道・東北2/13',
        '関東・甲信越0/19',
        '北陸・東海0/16',
        '近畿1/14',
        '中国・四国0/22',
        '九州・沖縄0/16',
      ])
    })
  })

  it('制覇した地方の見出しには「制覇」の印を付ける', () => {
    const allTohoku: StampBook = Object.fromEntries(
      castles
        .filter((c) => c.region === '北海道・東北')
        .map((c) => [c.number, { stampedOn: '2026-01-01', memo: '' }]),
    )
    renderPage(allTohoku)
    const [tohoku, kanto] = screen.getAllByRole('heading', { level: 2 })
    expect(tohoku).toHaveTextContent('北海道・東北制覇13/13')
    expect(kanto).not.toHaveTextContent('制覇')
  })

  describe('押印済みの印', () => {
    const book: StampBook = {
      59: { stampedOn: '2026-09-30', memo: '' },
      100: { stampedOn: null, memo: 'メモだけ' },
    }
    const itemOf = (name: string) => castleItems().find((li) => li.textContent?.includes(name))!

    it('押印済みの城にだけ印を表示する', () => {
      renderPage(book)
      expect(screen.getAllByRole('img', { name: '押印済み' })).toHaveLength(1)
      expect(within(itemOf('姫路城')).getByRole('img', { name: '押印済み' })).toBeInTheDocument()
    })

    it('メモだけの城には印を表示しない', () => {
      renderPage(book)
      expect(within(itemOf('首里城')).queryByRole('img', { name: '押印済み' })).toBeNull()
    })
  })

  describe('絞り込み', () => {
    const book: StampBook = { 59: { stampedOn: '2026-09-30', memo: '' } }
    const filterButton = (name: string) =>
      within(screen.getByRole('group', { name: '絞り込み' })).getByRole('button', { name })

    it('すべて・未押印・押印済みのボタンがあり、選択中のものが押された状態になる', () => {
      renderPage(book, 'unstamped')
      expect(filterButton('すべて')).toHaveAttribute('aria-pressed', 'false')
      expect(filterButton('未押印')).toHaveAttribute('aria-pressed', 'true')
      expect(filterButton('押印済み')).toHaveAttribute('aria-pressed', 'false')
    })

    it('ボタンを押すと選んだ絞り込みを知らせる', async () => {
      const { onFilterChange } = renderPage(book)
      await userEvent.click(filterButton('押印済み'))
      expect(onFilterChange).toHaveBeenCalledWith('stamped')
    })

    it('押印済み：押印済みの城だけを表示し、城のない地方は見出しごと出さない', () => {
      renderPage(book, 'stamped')
      expect(castleItems()).toHaveLength(1)
      expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
        '近畿1/14',
      ])
    })

    it('未押印：未押印の城だけを表示する', () => {
      renderPage(book, 'unstamped')
      expect(castleItems()).toHaveLength(99)
      expect(screen.queryByText('姫路城')).toBeNull()
    })

    it('絞り込んでも全体の進捗は変わらない', () => {
      renderPage(book, 'unstamped')
      expect(screen.getByRole('img', { name: /^全体 1\/100/ })).toBeInTheDocument()
    })

    it('該当する城がなければその旨を表示する', () => {
      renderPage({}, 'stamped')
      expect(castleItems()).toHaveLength(0)
      expect(screen.getByText('該当する城はありません')).toBeInTheDocument()
    })
  })

  describe('地方のリングをタップ', () => {
    const allTohoku: StampBook = Object.fromEntries(
      castles
        .filter((c) => c.region === '北海道・東北')
        .map((c) => [c.number, { stampedOn: '2026-01-01', memo: '' }]),
    )
    let scrolled: Element[]
    beforeEach(() => {
      scrolled = []
      // jsdom には scrollIntoView がないので、どの要素に対して呼ばれたかを記録する
      Element.prototype.scrollIntoView = vi.fn<(this: Element) => void>(function (this: Element) {
        scrolled.push(this)
      })
    })

    it('その地方の見出しまでスクロールする', async () => {
      renderPage({})
      await userEvent.click(screen.getByRole('button', { name: /^近畿/ }))
      expect(scrolled).toEqual([screen.getByRole('region', { name: /^近畿/ })])
    })

    it('絞り込みで表示されていない地方なら、絞り込みを「すべて」にしてからスクロールする', async () => {
      const onFilterChange = vi.fn<(filter: StampFilter) => void>()
      const ui = (filter: StampFilter) => (
        <MemoryRouter>
          <CastleListPage book={allTohoku} filter={filter} onFilterChange={onFilterChange} />
        </MemoryRouter>
      )
      const { rerender } = render(ui('unstamped'))
      await userEvent.click(screen.getByRole('button', { name: /^北海道・東北/ }))
      expect(onFilterChange).toHaveBeenCalledWith('all')
      expect(scrolled).toEqual([])

      rerender(ui('all'))
      expect(scrolled).toEqual([screen.getByRole('region', { name: /^北海道・東北/ })])
    })
  })
})
