import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ShareCode } from '../domain/shareCode'
import type { JoinResult } from '../sharing/joinSharing'
import { SharePage } from './SharePage'

const CODE = 'ABCD2345EFGH' as ShareCode

function renderPage({
  shareCode = null,
  onStartSharing = vi.fn<() => Promise<ShareCode>>(async () => CODE),
  onJoinSharing = vi.fn<(input: string) => Promise<JoinResult>>(async () => ({
    status: 'joined',
    code: CODE,
  })),
}: {
  shareCode?: ShareCode | null
  onStartSharing?: () => Promise<ShareCode>
  onJoinSharing?: (input: string) => Promise<JoinResult>
} = {}) {
  const view = render(
    <MemoryRouter initialEntries={['/share']}>
      <SharePage
        shareCode={shareCode}
        onStartSharing={onStartSharing}
        onJoinSharing={onJoinSharing}
      />
    </MemoryRouter>,
  )
  return { ...view, onStartSharing, onJoinSharing }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SharePage：共有を始める', () => {
  const startButton = () => screen.getByRole('button', { name: '共有を始める' })

  it('共有していなければ「共有を始める」を出す', () => {
    renderPage()
    expect(startButton()).toBeEnabled()
  })

  it('「共有を始める」で共有を始め、共有コードを表示する', async () => {
    const { onStartSharing, rerender } = renderPage()
    await userEvent.click(startButton())
    expect(onStartSharing).toHaveBeenCalledTimes(1)

    // 始めたあとは呼び出し元から共有コードが渡される
    rerender(
      <MemoryRouter initialEntries={['/share']}>
        <SharePage
          shareCode={CODE}
          onStartSharing={onStartSharing}
          onJoinSharing={vi.fn<(input: string) => Promise<JoinResult>>()}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('ABCD-2345-EFGH')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '共有を始める' })).toBeNull()
  })

  it('準備している間は押せない', async () => {
    const { onStartSharing } = renderPage({
      onStartSharing: vi.fn<() => Promise<ShareCode>>(() => new Promise(() => {})),
    })
    await userEvent.click(startButton())
    expect(screen.getByRole('button', { name: '準備しています…' })).toBeDisabled()
    expect(onStartSharing).toHaveBeenCalledTimes(1)
  })

  it('始められなければ理由を表示し、もう一度押せる', async () => {
    renderPage({
      onStartSharing: vi.fn<() => Promise<ShareCode>>(() => Promise.reject(new Error('offline'))),
    })
    await userEvent.click(startButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '共有を始められませんでした。電波の届く場所でもう一度お試しください。',
    )
    expect(startButton()).toBeEnabled()
  })
})

describe('SharePage：共有中', () => {
  it('共有コードを表示し、もう 1 人に伝える方法を案内する', () => {
    renderPage({ shareCode: CODE })
    expect(screen.getByText('ABCD-2345-EFGH')).toBeInTheDocument()
    expect(screen.getByText(/ホーム画面に追加したアプリ/)).toBeInTheDocument()
  })

  it('「コピー」で共有コードをクリップボードにコピーする', async () => {
    const user = userEvent.setup()
    renderPage({ shareCode: CODE })
    await user.click(screen.getByRole('button', { name: 'コピー' }))
    expect(await navigator.clipboard.readText()).toBe('ABCD-2345-EFGH')
    expect(screen.getByRole('status')).toHaveTextContent('コピーしました')
  })

  it('共有シートが使えれば「送る」で共有コードを送れる', async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>(async () => {})
    vi.stubGlobal('navigator', { ...navigator, share })
    renderPage({ shareCode: CODE })
    await userEvent.click(screen.getByRole('button', { name: '送る' }))
    expect(share).toHaveBeenCalledWith({
      text: expect.stringContaining('ABCD-2345-EFGH') as string,
    })
  })

  it('共有シートが使えなければ「送る」を出さない', () => {
    vi.stubGlobal('navigator', { ...navigator, share: undefined })
    renderPage({ shareCode: CODE })
    expect(screen.queryByRole('button', { name: '送る' })).toBeNull()
  })
})
