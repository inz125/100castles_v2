import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
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

function renderPage(provider: LocationProvider) {
  render(
    <MemoryRouter initialEntries={['/nearby']}>
      <NearbyPage locationProvider={provider} />
    </MemoryRouter>,
  )
}

describe('NearbyPage：現在地の取得', () => {
  it('開いたらすぐ現在地を取りに行き、取得中と表示する', () => {
    const { provider } = deferredProvider()
    renderPage(provider)
    expect(screen.getByRole('status')).toHaveTextContent('現在地を取得しています…')
  })

  it('取得できたら取得中の表示を消す', async () => {
    const { provider, respond } = deferredProvider()
    renderPage(provider)
    respond({ status: 'ok', position: { latitude: 36.2386, longitude: 137.9689 } })
    await screen.findByTestId('nearby-ready')
    expect(screen.queryByText('現在地を取得しています…')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('許可されていなければ、設定アプリで許可する方法を表示する', async () => {
    const { provider, respond } = deferredProvider()
    renderPage(provider)
    respond({ status: 'denied' })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('位置情報の利用が許可されていません')
    expect(alert).toHaveTextContent(
      '『設定』→『プライバシーとセキュリティ』→『位置情報サービス』→『Safari Webサイト』',
    )
    expect(screen.queryByText('現在地を取得しています…')).toBeNull()
  })

  it('失敗したら、電波の届く場所で取り直すよう表示する', async () => {
    const { provider, respond } = deferredProvider()
    renderPage(provider)
    respond({ status: 'failed' })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '現在地を取得できませんでした。電波の届く場所で『更新』を押してください。',
    )
  })
})
