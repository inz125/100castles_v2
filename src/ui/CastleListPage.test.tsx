import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { REGIONS } from '../domain/castles'
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
})
