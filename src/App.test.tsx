import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

function renderApp(repository: StampBookRepository = new InMemoryStampBookRepository()) {
  render(<App repository={repository} preferenceStorage={localStorage} />)
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
})
