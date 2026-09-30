import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { castles } from '../domain/castles'
import type { StampBook } from '../domain/stampBook'
import { MapPage } from './MapPage'

function renderPage(book: StampBook = {}) {
  return render(
    <MemoryRouter initialEntries={['/map']}>
      <MapPage book={book} />
    </MemoryRouter>,
  )
}

const pins = () => [...document.querySelectorAll<HTMLElement>('.leaflet-marker-icon.map-pin')]
const pinOf = (name: string) => pins().find((p) => p.title === name)!

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
        <MapPage book={{ 59: { stampedOn: '2026-09-30', memo: '' } }} />
      </MemoryRouter>,
    )
    expect(pins()).toHaveLength(100)
    expect(pinOf('姫路城')).toHaveClass('map-pin--stamped')
  })
})
