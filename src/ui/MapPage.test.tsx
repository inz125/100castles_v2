import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { MapPage } from './MapPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/map']}>
      <MapPage />
    </MemoryRouter>,
  )
}

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
