import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { BackLink, CastleLink } from './castleLinks'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/castles/:number" element={<BackLink />} />
        <Route
          path="*"
          element={
            <CastleLink castleNumber={59} className="row">
              姫路城
            </CastleLink>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CastleLink と BackLink', () => {
  it.each([
    ['/', '一覧に戻る'],
    ['/nearby', '近くに戻る'],
    ['/map', '地図に戻る'],
  ])('%s から開いた詳細画面の「戻る」は開く前の画面を指す', async (from, backName) => {
    renderAt(from)
    const link = screen.getByRole('link', { name: '姫路城' })
    expect(link).toHaveAttribute('href', '/castles/59')
    expect(link).toHaveClass('row')

    await userEvent.click(link)
    expect(screen.getByRole('link', { name: backName })).toHaveAttribute('href', from)
  })
})
