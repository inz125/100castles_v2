import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Celebration, REGION_CELEBRATION_MS } from './Celebration'

describe('Celebration：地方を制覇', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('「〇〇 制覇」の印を表示する', () => {
    render(<Celebration completion={{ kind: 'region', region: '近畿' }} onDismiss={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent('近畿制覇')
  })

  it('少し経つと消える', () => {
    const onDismiss = vi.fn<() => void>()
    render(<Celebration completion={{ kind: 'region', region: '近畿' }} onDismiss={onDismiss} />)
    act(() => vi.advanceTimersByTime(REGION_CELEBRATION_MS - 1))
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('タップでも消せる', () => {
    const onDismiss = vi.fn<() => void>()
    render(<Celebration completion={{ kind: 'region', region: '近畿' }} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('status'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

describe('Celebration：100 城を制覇', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('「日本100名城 制覇」の大きな印と桜の花びらを表示する', () => {
    const { container } = render(<Celebration completion={{ kind: 'all' }} onDismiss={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent('日本100名城制覇')
    expect(screen.getByRole('status')).toHaveClass('celebration--all')
    expect(container.querySelectorAll('.petal').length).toBeGreaterThan(0)
  })

  it('時間が経っても消えず、タップすると消える', () => {
    const onDismiss = vi.fn<() => void>()
    render(<Celebration completion={{ kind: 'all' }} onDismiss={onDismiss} />)
    act(() => vi.advanceTimersByTime(60_000))
    expect(onDismiss).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('status'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
