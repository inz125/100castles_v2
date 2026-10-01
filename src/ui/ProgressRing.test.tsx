import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressRing } from './ProgressRing'

describe('ProgressRing', () => {
  it('名前・押印済みの数・達成率を読み上げられる', () => {
    render(<ProgressRing label="全体" progress={{ stamped: 37, total: 100 }} />)
    expect(screen.getByRole('img', { name: '全体 37/100（37%）' })).toBeInTheDocument()
  })

  it('達成率は切り捨てる（揃うまでは 100% にしない）', () => {
    render(<ProgressRing label="九州・沖縄" progress={{ stamped: 15, total: 16 }} />)
    expect(screen.getByRole('img', { name: '九州・沖縄 15/16（93%）' })).toBeInTheDocument()
  })

  it('押印済みの割合だけリングを塗る', () => {
    const { container } = render(<ProgressRing label="全体" progress={{ stamped: 1, total: 4 }} />)
    const fill = container.querySelector('.progress-ring__fill')
    expect(fill).toHaveAttribute('stroke-dasharray', '25 100')
  })

  it('1 つも押印していなければ朱を塗らない（線の丸い端だけが点で残らないように）', () => {
    const { container } = render(
      <ProgressRing label="全体" progress={{ stamped: 0, total: 100 }} />,
    )
    expect(container.querySelector('.progress-ring__fill')).toBeNull()
  })

  it('中央に渡した内容を表示する', () => {
    render(
      <ProgressRing label="全体" progress={{ stamped: 1, total: 4 }}>
        <span>中央</span>
      </ProgressRing>,
    )
    expect(screen.getByText('中央')).toBeInTheDocument()
  })

  it('揃ったら「制覇」も読み上げる', () => {
    render(<ProgressRing label="近畿" progress={{ stamped: 14, total: 14 }} />)
    expect(screen.getByRole('img', { name: '近畿 14/14（100%）制覇' })).toHaveClass(
      'progress-ring--completed',
    )
  })
})
