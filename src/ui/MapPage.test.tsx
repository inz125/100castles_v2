import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { castles } from '../domain/castles'
import type { StampBook } from '../domain/stampBook'
import type { LocationProvider, LocationResult } from '../location/locationProvider'
import { MapPage } from './MapPage'

/** 現在地の取得が終わらない窓口 */
const pendingLocation: LocationProvider = { getCurrentPosition: () => new Promise(() => {}) }

function renderPage(book: StampBook = {}, locationProvider = pendingLocation) {
  return render(
    <MemoryRouter initialEntries={['/map']}>
      <MapPage book={book} locationProvider={locationProvider} />
    </MemoryRouter>,
  )
}

const pins = () => [...document.querySelectorAll<HTMLElement>('.leaflet-marker-icon.map-pin')]
const pinOf = (name: string) => pins().find((p) => p.title === name)!
/**
 * ピンをタップする。userEvent だと続けてのクリックがダブルクリック扱いになり、
 * レイアウトのない jsdom では Leaflet が位置を計算できないため、クリックだけを送る
 */
const tapPin = (name: string) => fireEvent.click(pinOf(name))

describe('MapPage：地図の表示', () => {
  it('見出しと地図の領域がある', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 2, name: '地図' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '城の地図' })).toBeInTheDocument()
  })

  it('国土地理院の標準地図タイルを使う', () => {
    const { container } = renderPage()
    const tiles = [...container.querySelectorAll<HTMLImageElement>('img.leaflet-tile')]
    expect(tiles.length).toBeGreaterThan(0)
    for (const tile of tiles) {
      expect(tile.src).toMatch(
        /^https:\/\/cyberjapandata\.gsi\.go\.jp\/xyz\/std\/\d+\/\d+\/\d+\.png$/,
      )
    }
  })

  it('出典（国土地理院）を表記し、タイル一覧のページにリンクする', () => {
    renderPage()
    const map = screen.getByRole('region', { name: '城の地図' })
    expect(within(map).getByRole('link', { name: '国土地理院' })).toHaveAttribute(
      'href',
      'https://maps.gsi.go.jp/development/ichiran.html',
    )
  })

  it('画面を離れると地図を片付ける（開き直しても二重に作らない）', () => {
    const { unmount } = renderPage()
    unmount()
    renderPage()
    expect(document.querySelectorAll('.leaflet-container')).toHaveLength(1)
  })
})

describe('MapPage：城のピン', () => {
  it('100 城すべてにピンを立てる（城名つき）', () => {
    renderPage()
    expect(pins()).toHaveLength(100)
    expect(pins().map((p) => p.title)).toEqual(castles.map((c) => c.name))
  })

  it('押印済みは朱色、未押印は墨色のピン', () => {
    renderPage({ 59: { stampedOn: '2026-09-30', memo: '' } })
    expect(pinOf('姫路城')).toHaveClass('map-pin--stamped')
    expect(pinOf('姫路城')).not.toHaveClass('map-pin--unstamped')
    expect(pinOf('首里城')).toHaveClass('map-pin--unstamped')
    expect(pins().filter((p) => p.classList.contains('map-pin--stamped'))).toHaveLength(1)
  })

  it('記録が変わるとピンの色も変わる', () => {
    const { rerender } = renderPage()
    rerender(
      <MemoryRouter initialEntries={['/map']}>
        <MapPage
          book={{ 59: { stampedOn: '2026-09-30', memo: '' } }}
          locationProvider={pendingLocation}
        />
      </MemoryRouter>,
    )
    expect(pins()).toHaveLength(100)
    expect(pinOf('姫路城')).toHaveClass('map-pin--stamped')
  })
})

describe('MapPage：ピンの吹き出し', () => {
  const popup = () => screen.getByRole('dialog', { name: /の情報$/ })

  it('ピンをタップすると城名・番号・押印の状態を表示する', () => {
    renderPage({ 59: { stampedOn: '2026-09-30', memo: '' } })
    tapPin('姫路城')
    expect(within(popup()).getByText('姫路城')).toBeInTheDocument()
    expect(within(popup()).getByText('No.59')).toBeInTheDocument()
    expect(within(popup()).getByText('押印済み（2026-09-30）')).toBeInTheDocument()
  })

  it('未押印の城は未押印と表示する', () => {
    renderPage()
    tapPin('首里城')
    expect(within(popup()).getByText('未押印')).toBeInTheDocument()
  })

  it('「詳細を見る」は詳細画面へのリンク', () => {
    renderPage()
    tapPin('首里城')
    expect(within(popup()).getByRole('link', { name: '詳細を見る' })).toHaveAttribute(
      'href',
      '/castles/100',
    )
  })

  it('別のピンをタップすると吹き出しがその城に替わる', () => {
    renderPage()
    tapPin('姫路城')
    tapPin('首里城')
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(within(popup()).getByText('首里城')).toBeInTheDocument()
  })
})

describe('MapPage：現在地', () => {
  // 姫路駅付近
  const HERE = { latitude: 34.8266, longitude: 134.6907 }
  const hereMarker = () => document.querySelector('.leaflet-marker-icon.map-here')
  const moveButton = () => screen.getByRole('button', { name: '現在地へ移動' })

  /** 呼ばれた順に結果を返せる偽の窓口 */
  function queuedProvider() {
    const responders: ((result: LocationResult) => void)[] = []
    const provider: LocationProvider = {
      getCurrentPosition: () => new Promise((resolve) => responders.push(resolve)),
    }
    return { provider, responders }
  }

  it('開いたときに現在地を取得し、取得できたら現在地の点を表示する', async () => {
    const { provider, responders } = queuedProvider()
    renderPage({}, provider)
    expect(responders).toHaveLength(1)
    expect(hereMarker()).toBeNull()

    responders[0]({ status: 'ok', position: HERE })
    await waitFor(() => expect(hereMarker()).not.toBeNull())
  })

  it('開いたときの取得に失敗しても何も表示しない', async () => {
    const { provider, responders } = queuedProvider()
    renderPage({}, provider)
    responders[0]({ status: 'denied' })
    await waitFor(() => expect(moveButton()).toBeEnabled())
    expect(screen.queryByRole('alert')).toBeNull()
    expect(hereMarker()).toBeNull()
  })

  it('「現在地へ移動」で現在地を取り直す（取得中は押せない）', async () => {
    const { provider, responders } = queuedProvider()
    renderPage({}, provider)
    expect(moveButton()).toBeDisabled()
    responders[0]({ status: 'failed' })
    await waitFor(() => expect(moveButton()).toBeEnabled())

    await userEvent.click(moveButton())
    expect(responders).toHaveLength(2)
    expect(moveButton()).toBeDisabled()
    responders[1]({ status: 'ok', position: HERE })
    await waitFor(() => expect(hereMarker()).not.toBeNull())
    expect(moveButton()).toBeEnabled()
  })

  it.each([
    ['denied', '位置情報の利用が許可されていません'],
    ['failed', '現在地を取得できませんでした'],
  ] as const)('「現在地へ移動」で取得できなければ理由を表示する（%s）', async (status, message) => {
    const { provider, responders } = queuedProvider()
    renderPage({}, provider)
    responders[0]({ status: 'ok', position: HERE })
    await waitFor(() => expect(moveButton()).toBeEnabled())

    await userEvent.click(moveButton())
    responders[1]({ status })
    expect(await screen.findByRole('alert')).toHaveTextContent(message)

    // 取り直して取得できたら消える
    await userEvent.click(moveButton())
    responders[2]({ status: 'ok', position: HERE })
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  })
})
