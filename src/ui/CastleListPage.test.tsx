import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { REGIONS } from '../domain/castles'
import type { StampBook } from '../domain/stampBook'
import { CastleListPage } from './CastleListPage'

describe('CastleListPage', () => {
  it('6 地方の見出しをスタンプ帳の順に表示する', () => {
    render(<CastleListPage book={{}} />)
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual(
      REGIONS.map((region) => expect.stringContaining(region)),
    )
  })

  it('100 城を表示する', () => {
    render(<CastleListPage book={{}} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(100)
  })

  it('各地方の中に、その地方の城を番号・城名・都道府県つきで番号順に表示する', () => {
    render(<CastleListPage book={{}} />)
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

    it('全体の進捗を xx/100 で表示する', () => {
      render(<CastleListPage book={book} />)
      expect(screen.getByText('3/100')).toBeInTheDocument()
    })

    it('地方の見出しに地方ごとの進捗を表示する', () => {
      render(<CastleListPage book={book} />)
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

  describe('押印済みの印', () => {
    const book: StampBook = {
      59: { stampedOn: '2026-09-30', memo: '' },
      100: { stampedOn: null, memo: 'メモだけ' },
    }
    const itemOf = (name: string) =>
      screen.getAllByRole('listitem').find((li) => li.textContent?.includes(name))!

    it('押印済みの城にだけ印を表示する', () => {
      render(<CastleListPage book={book} />)
      expect(screen.getAllByRole('img', { name: '押印済み' })).toHaveLength(1)
      expect(within(itemOf('姫路城')).getByRole('img', { name: '押印済み' })).toBeInTheDocument()
    })

    it('メモだけの城には印を表示しない', () => {
      render(<CastleListPage book={book} />)
      expect(within(itemOf('首里城')).queryByRole('img', { name: '押印済み' })).toBeNull()
    })
  })
})
