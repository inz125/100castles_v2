import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { castles } from '../domain/castles'
import { distanceInMeters } from '../domain/distance'
import { formatDistance } from '../domain/formatDistance'
import type { StampBook, StampFilter } from '../domain/stampBook'
import type { LocationProvider, LocationResult } from '../location/locationProvider'
import { NearbyPage } from './NearbyPage'

/** 結果を後から返せる偽の窓口 */
function deferredProvider() {
  let respond: (result: LocationResult) => void = () => {}
  const provider: LocationProvider = {
    getCurrentPosition: () => new Promise((resolve) => (respond = resolve)),
  }
  return { provider, respond: (result: LocationResult) => respond(result) }
}

// 松本駅付近
const HERE = { latitude: 36.2308, longitude: 137.9642 }
const byName = (name: string) => castles.find((c) => c.name === name)!

function renderPage({
  provider = { getCurrentPosition: async () => ({ status: 'ok', position: HERE }) },
  book = {},
  filter = 'all',
  onFilterChange = vi.fn<(filter: StampFilter) => void>(),
}: {
  provider?: LocationProvider
  book?: StampBook
  filter?: StampFilter
  onFilterChange?: (filter: StampFilter) => void
} = {}) {
  render(
    <MemoryRouter initialEntries={['/nearby']}>
      <NearbyPage
        locationProvider={provider}
        book={book}
        filter={filter}
        onFilterChange={onFilterChange}
      />
    </MemoryRouter>,
  )
  return { onFilterChange }
}

describe('NearbyPage：現在地の取得', () => {
  it('開いたらすぐ現在地を取りに行き、取得中と表示する', () => {
    const { provider } = deferredProvider()
    renderPage({ provider })
    expect(screen.getByRole('status')).toHaveTextContent('現在地を取得しています…')
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('取得できたら取得中の表示を消す', async () => {
    const { provider, respond } = deferredProvider()
    renderPage({ provider })
    respond({ status: 'ok', position: HERE })
    await screen.findAllByRole('listitem')
    expect(screen.queryByText('現在地を取得しています…')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('許可されていなければ、設定アプリで許可する方法を表示する', async () => {
    const { provider, respond } = deferredProvider()
    renderPage({ provider })
    respond({ status: 'denied' })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('位置情報の利用が許可されていません')
    expect(alert).toHaveTextContent(
      '『設定』→『プライバシーとセキュリティ』→『位置情報サービス』→『Safari Webサイト』',
    )
    expect(screen.queryByText('現在地を取得しています…')).toBeNull()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('失敗したら、電波の届く場所で取り直すよう表示する', async () => {
    const { provider, respond } = deferredProvider()
    renderPage({ provider })
    respond({ status: 'failed' })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '現在地を取得できませんでした。電波の届く場所で『更新』を押してください。',
    )
  })
})

describe('NearbyPage：近い順の一覧', () => {
  it('城を現在地から近い順に並べ、距離を表示する', async () => {
    renderPage()
    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(100)
    expect(items[0]).toHaveTextContent('松本城')
    expect(items[0]).toHaveTextContent(formatDistance(distanceInMeters(HERE, byName('松本城'))))
    expect(items[1]).toHaveTextContent('上田城')
    expect(items[99]).toHaveTextContent('首里城')
  })

  it('各城は詳細画面へのリンクになっている', async () => {
    renderPage()
    expect(await screen.findByRole('link', { name: /松本城/ })).toHaveAttribute(
      'href',
      '/castles/29',
    )
  })

  it('押印済みの城には印を表示する', async () => {
    renderPage({ book: { 29: { stampedOn: '2026-09-30', memo: '' } } })
    const [first] = await screen.findAllByRole('listitem')
    expect(within(first).getByRole('img', { name: '押印済み' })).toBeInTheDocument()
  })

  it('絞り込みに合う城だけを近い順に並べる', async () => {
    renderPage({ book: { 29: { stampedOn: '2026-09-30', memo: '' } }, filter: 'unstamped' })
    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(99)
    expect(items[0]).toHaveTextContent('上田城')
  })

  it('該当する城がなければその旨を表示する', async () => {
    renderPage({ filter: 'stamped' })
    expect(await screen.findByText('該当する城はありません')).toBeInTheDocument()
  })

  it('絞り込みを選ぶと呼び出し元に伝える', async () => {
    const { onFilterChange } = renderPage({ filter: 'unstamped' })
    expect(screen.getByRole('button', { name: '未押印' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'すべて' }))
    expect(onFilterChange).toHaveBeenCalledWith('all')
  })
})
