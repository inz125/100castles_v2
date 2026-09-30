import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { castles } from '../domain/castles'
import type { StampRecord } from '../domain/stampRecord'
import { CastleDetailPage } from './CastleDetailPage'

const HIMEJI = castles[58]

function renderPage(record: StampRecord) {
  const onChange = vi.fn<(record: StampRecord) => void>()
  const page = (r: StampRecord) => (
    <MemoryRouter>
      <CastleDetailPage castle={HIMEJI} record={r} today={() => '2026-09-30'} onChange={onChange} />
    </MemoryRouter>
  )
  const { rerender, unmount } = render(page(record))
  return { onChange, rerender: (r: StampRecord) => rerender(page(r)), unmount }
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('CastleDetailPage のメモ', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    setVisibility('visible')
  })

  const memo = () => screen.getByRole('textbox', { name: 'メモ' })
  const typeMemo = (value: string) => fireEvent.change(memo(), { target: { value } })

  it('保存済みのメモを表示する', () => {
    renderPage({ stampedOn: null, memo: '天守は現存' })
    expect(memo()).toHaveValue('天守は現存')
  })

  it('入力が 1 秒止まったら保存する（入力中は保存しない）', () => {
    const { onChange } = renderPage({ stampedOn: '2026-09-01', memo: '' })
    typeMemo('白鷺城')
    expect(onChange).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(999))
    expect(onChange).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ stampedOn: '2026-09-01', memo: '白鷺城' })
  })

  it('入力欄から離れたらすぐ保存し、その後に二重には保存しない', () => {
    const { onChange } = renderPage({ stampedOn: null, memo: '' })
    typeMemo('abc')
    fireEvent.blur(memo())
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ stampedOn: null, memo: 'abc' })

    act(() => vi.advanceTimersByTime(5000))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('アプリが隠れたら（別アプリへの切り替えなど）すぐ保存する', () => {
    const { onChange } = renderPage({ stampedOn: null, memo: '' })
    typeMemo('abc')
    act(() => setVisibility('hidden'))
    expect(onChange).toHaveBeenCalledWith({ stampedOn: null, memo: 'abc' })
  })

  it('ページが閉じられる・再読み込みされるとき（pagehide）にもすぐ保存する', () => {
    const { onChange } = renderPage({ stampedOn: null, memo: '' })
    typeMemo('abc')
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    expect(onChange).toHaveBeenCalledWith({ stampedOn: null, memo: 'abc' })
  })

  it('画面を離れるときに保存していない入力があれば保存する', () => {
    const { onChange, unmount } = renderPage({ stampedOn: null, memo: '' })
    typeMemo('abc')
    unmount()
    expect(onChange).toHaveBeenCalledWith({ stampedOn: null, memo: 'abc' })
  })

  it('内容が変わっていなければ保存しない', () => {
    const { onChange } = renderPage({ stampedOn: null, memo: 'abc' })
    fireEvent.focus(memo())
    fireEvent.blur(memo())
    act(() => vi.advanceTimersByTime(5000))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('メモの保存は最新の記録に対して行う（押印日を上書きで戻さない）', () => {
    const { onChange, rerender } = renderPage({ stampedOn: null, memo: '' })
    typeMemo('abc')
    rerender({ stampedOn: '2026-09-30', memo: '' })
    act(() => vi.advanceTimersByTime(1000))
    expect(onChange).toHaveBeenLastCalledWith({ stampedOn: '2026-09-30', memo: 'abc' })
  })

  it('保存に失敗して記録が元に戻っても入力欄の文字は残し、入力欄から離れたら保存し直す', () => {
    const { onChange, rerender } = renderPage({ stampedOn: null, memo: '' })
    typeMemo('abc')
    fireEvent.blur(memo())
    expect(onChange).toHaveBeenCalledTimes(1)
    rerender({ stampedOn: null, memo: 'abc' }) // 画面にはいったん反映される

    rerender({ stampedOn: null, memo: '' }) // 保存に失敗して元に戻る
    expect(memo()).toHaveValue('abc')

    fireEvent.focus(memo())
    fireEvent.blur(memo())
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith({ stampedOn: null, memo: 'abc' })
  })
})
