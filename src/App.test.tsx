import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { InMemoryStampBookRepository } from './repository/inMemoryStampBookRepository'
import { UnsupportedVersionError, type StampBookRepository } from './repository/stampBookRepository'
import { FILTER_STORAGE_KEY } from './ui/filterPreference'

function failingRepository(error: unknown): StampBookRepository {
  return {
    load: () => Promise.reject(error),
    saveRecord: () => Promise.reject(error),
  }
}

/** 日本時間の 2026-09-30 00:30（UTC ではまだ 9/29） */
const NOW = new Date(2026, 8, 30, 0, 30)

function renderApp(
  repository: StampBookRepository = new InMemoryStampBookRepository(),
  initialPath = '/',
) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App repository={repository} preferenceStorage={localStorage} now={() => NOW} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('アプリ名を見出しとして表示する', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1, name: '100名城スタンプ帳' })).toBeInTheDocument()
  })

  it('読み込みが終わるまでは読み込み中と表示する', () => {
    renderApp({ load: () => new Promise(() => {}), saveRecord: async () => {} })
    expect(screen.getByText('読み込み中…')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('保存されている記録を読み込んで一覧に表示する', async () => {
    const repository = new InMemoryStampBookRepository()
    await repository.saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
    renderApp(repository)
    expect(await screen.findByText('1/100')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(100)
    expect(screen.queryByText('読み込み中…')).toBeNull()
  })

  it('新しいバージョンのデータなら、アプリの更新を促し一覧は出さない', async () => {
    renderApp(failingRepository(new UnsupportedVersionError(2)))
    expect(await screen.findByRole('alert')).toHaveTextContent('アプリを更新してください')
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('それ以外の理由で読み込めなければ、その旨を表示する', async () => {
    renderApp(failingRepository(new Error('boom')))
    expect(await screen.findByRole('alert')).toHaveTextContent('記録を読み込めませんでした')
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  describe('絞り込み', () => {
    it('前回選んだ絞り込みで表示する', async () => {
      localStorage.setItem(FILTER_STORAGE_KEY, 'stamped')
      renderApp()
      expect(await screen.findByText('該当する城はありません')).toBeInTheDocument()
    })

    it('選んだ絞り込みを表示に反映し、保存する', async () => {
      renderApp()
      await userEvent.click(await screen.findByRole('button', { name: '押印済み' }))
      expect(screen.getByText('該当する城はありません')).toBeInTheDocument()
      expect(localStorage.getItem(FILTER_STORAGE_KEY)).toBe('stamped')
    })
  })

  describe('画面の切り替え', () => {
    it('一覧で城を選ぶと詳細画面に移る', async () => {
      renderApp()
      await userEvent.click(await screen.findByRole('link', { name: /姫路城/ }))
      expect(screen.getByRole('heading', { level: 2, name: '姫路城' })).toBeInTheDocument()
      expect(screen.getByText('兵庫県')).toBeInTheDocument()
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    })

    it('詳細画面から一覧に戻れる', async () => {
      renderApp(undefined, '/castles/59')
      await userEvent.click(await screen.findByRole('link', { name: '一覧に戻る' }))
      expect(screen.getAllByRole('listitem')).toHaveLength(100)
    })

    it('URL で直接詳細画面を開ける', async () => {
      renderApp(undefined, '/castles/100')
      expect(await screen.findByRole('heading', { level: 2, name: '首里城' })).toBeInTheDocument()
    })

    it.each(['/castles/0', '/castles/101', '/castles/abc'])(
      '存在しない城（%s）なら見つからない旨を表示する',
      async (path) => {
        renderApp(undefined, path)
        expect(await screen.findByText('城が見つかりません')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: '一覧に戻る' })).toBeInTheDocument()
      },
    )
  })

  describe('詳細画面で押印済みを切り替える', () => {
    const stampedCheckbox = () => screen.findByRole('checkbox', { name: '押印済み' })

    it('ON にすると今日（日本時間）の日付が押印日に入り、すぐ保存される', async () => {
      const repository = new InMemoryStampBookRepository()
      renderApp(repository, '/castles/59')
      await userEvent.click(await stampedCheckbox())

      expect(await stampedCheckbox()).toBeChecked()
      expect(screen.getByText('2026-09-30')).toBeInTheDocument()
      expect(await repository.load()).toEqual({ 59: { stampedOn: '2026-09-30', memo: '' } })
    })

    it('OFF にすると押印日が消え、すぐ保存される', async () => {
      const repository = new InMemoryStampBookRepository()
      await repository.saveRecord(59, { stampedOn: '2026-01-01', memo: 'メモ' })
      renderApp(repository, '/castles/59')
      expect(await stampedCheckbox()).toBeChecked()
      expect(screen.getByText('2026-01-01')).toBeInTheDocument()

      await userEvent.click(await stampedCheckbox())

      expect(await stampedCheckbox()).not.toBeChecked()
      expect(screen.queryByText('2026-01-01')).toBeNull()
      expect(await repository.load()).toEqual({ 59: { stampedOn: null, memo: 'メモ' } })
    })

    it('一覧に戻ると印と進捗に反映されている', async () => {
      renderApp(undefined, '/castles/59')
      await userEvent.click(await stampedCheckbox())
      await userEvent.click(screen.getByRole('link', { name: '一覧に戻る' }))

      expect(screen.getByText('1/100')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /姫路城/ })).toContainElement(
        screen.getByRole('img', { name: '押印済み' }),
      )
    })

    it('保存に失敗したら元の状態に戻し、保存できなかったことを表示する', async () => {
      const repository = new InMemoryStampBookRepository()
      repository.saveRecord = () => Promise.reject(new Error('quota exceeded'))
      renderApp(repository, '/castles/59')
      await userEvent.click(await stampedCheckbox())

      expect(await screen.findByRole('alert')).toHaveTextContent('保存できませんでした')
      expect(await stampedCheckbox()).not.toBeChecked()
      expect(screen.queryByText('2026-09-30')).toBeNull()
    })
  })
})
