import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeAppUpdater } from './FakeAppUpdater'
import { CHECK_INTERVAL_MS, useAppUpdate } from './useAppUpdate'

let visibility: DocumentVisibilityState = 'visible'
let onLine = true

/** アプリを隠す・前面に戻す */
function setVisibility(state: DocumentVisibilityState) {
  visibility = state
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  visibility = 'visible'
  onLine = true
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
  vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => onLine)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useAppUpdate', () => {
  it('最初はポップアップを出さない', () => {
    const { result } = renderHook(() => useAppUpdate(new FakeAppUpdater()))
    expect(result.current.prompt).toBe(false)
  })

  it('新しい版が見つかったらポップアップを出す', () => {
    const updater = new FakeAppUpdater()
    const { result } = renderHook(() => useAppUpdate(updater))
    act(() => updater.findNewVersion())
    expect(result.current.prompt).toBe(true)
  })

  it('前面に戻ったときに確認する（隠れたときは確認しない）', () => {
    const updater = new FakeAppUpdater()
    renderHook(() => useAppUpdate(updater))
    setVisibility('hidden')
    expect(updater.check).not.toHaveBeenCalled()
    setVisibility('visible')
    expect(updater.check).toHaveBeenCalledTimes(1)
  })

  it('開いている間は 1 時間ごとに確認する', () => {
    const updater = new FakeAppUpdater()
    renderHook(() => useAppUpdate(updater))
    act(() => vi.advanceTimersByTime(CHECK_INTERVAL_MS - 1))
    expect(updater.check).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(updater.check).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(CHECK_INTERVAL_MS))
    expect(updater.check).toHaveBeenCalledTimes(2)
    expect(CHECK_INTERVAL_MS).toBe(60 * 60 * 1000)
  })

  it('電波がないときは確認しない', () => {
    const updater = new FakeAppUpdater()
    renderHook(() => useAppUpdate(updater))
    onLine = false
    setVisibility('visible')
    act(() => vi.advanceTimersByTime(CHECK_INTERVAL_MS))
    expect(updater.check).not.toHaveBeenCalled()
  })

  it('確認に失敗しても何も出さない（例外を外に出さない）', async () => {
    const updater = new FakeAppUpdater()
    updater.check.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useAppUpdate(updater))
    setVisibility('visible')
    await act(async () => {})
    expect(result.current.prompt).toBe(false)
  })

  it('「あとで」で閉じたら、開いている間は出さず、次に前面に戻ったときに出し直す', () => {
    const updater = new FakeAppUpdater()
    const { result } = renderHook(() => useAppUpdate(updater))
    act(() => updater.findNewVersion())
    act(() => result.current.later())
    expect(result.current.prompt).toBe(false)

    // 開いている間に見つかり直しても出さない
    act(() => updater.findNewVersion())
    act(() => vi.advanceTimersByTime(CHECK_INTERVAL_MS))
    expect(result.current.prompt).toBe(false)

    setVisibility('hidden')
    setVisibility('visible')
    expect(result.current.prompt).toBe(true)
  })

  it('見つかっていなければ、前面に戻っても出さない', () => {
    const { result } = renderHook(() => useAppUpdate(new FakeAppUpdater()))
    setVisibility('hidden')
    setVisibility('visible')
    expect(result.current.prompt).toBe(false)
  })

  it('「更新」で新しい版に切り替える', () => {
    const updater = new FakeAppUpdater()
    const { result } = renderHook(() => useAppUpdate(updater))
    result.current.apply()
    expect(updater.apply).toHaveBeenCalledTimes(1)
  })
})
