import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, type InitialEntry } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import type { LocationProvider } from './location/locationProvider'
import { InMemoryStampBookRepository } from './repository/inMemoryStampBookRepository'
import { UnsupportedVersionError, type StampBookRepository } from './repository/stampBookRepository'
import { FILTER_STORAGE_KEY } from './ui/filterPreference'

function failingRepository(error: unknown): StampBookRepository {
  return {
    load: () => Promise.reject(error),
    saveRecord: () => Promise.reject(error),
  }
}

/** 現在地の取得が終わらない窓口（近くタブの中身は NearbyPage のテストで確かめる） */
const pendingLocation: LocationProvider = { getCurrentPosition: () => new Promise(() => {}) }

/** 日本時間の 2026-09-30 00:30（UTC ではまだ 9/29） */
const NOW = new Date(2026, 8, 30, 0, 30)

function renderApp(
  repository: StampBookRepository = new InMemoryStampBookRepository(),
  initialPath: InitialEntry = '/',
) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App
        repository={repository}
        preferenceStorage={localStorage}
        locationProvider={pendingLocation}
        now={() => NOW}
      />
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

  describe('タブバー', () => {
    const tabBar = () => screen.getByRole('navigation', { name: 'タブ' })
    const tab = (name: string) => within(tabBar()).getByRole('link', { name })

    it('一覧・近く・地図のタブがあり、開いているタブが選択状態になる', async () => {
      renderApp()
      await screen.findByText('0/100')
      expect(
        within(tabBar())
          .getAllByRole('link')
          .map((l) => l.textContent),
      ).toEqual(['一覧', '近く', '地図'])
      expect(tab('一覧')).toHaveAttribute('aria-current', 'page')
      expect(tab('近く')).not.toHaveAttribute('aria-current')
    })

    it.each([
      ['近く', '近くの城'],
      ['地図', '地図'],
    ])('「%s」タブで %s の画面に切り替わる', async (tabName, heading) => {
      renderApp()
      await screen.findByText('0/100')
      await userEvent.click(tab(tabName))
      expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument()
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
      expect(tab(tabName)).toHaveAttribute('aria-current', 'page')
    })

    it('「一覧」タブで一覧に戻る', async () => {
      renderApp(undefined, '/map')
      await userEvent.click(await screen.findByRole('link', { name: '一覧' }))
      expect(screen.getAllByRole('listitem')).toHaveLength(100)
    })

    it.each([
      ['/nearby', '近くの城'],
      ['/map', '地図'],
    ])('URL（%s）で直接開ける', async (path, heading) => {
      renderApp(undefined, path)
      expect(await screen.findByRole('heading', { level: 2, name: heading })).toBeInTheDocument()
    })

    it('詳細画面でもタブバーを表示する', async () => {
      renderApp(undefined, '/castles/59')
      await screen.findByRole('heading', { level: 2, name: '姫路城' })
      expect(tabBar()).toBeInTheDocument()
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

    it.each([
      ['/nearby', '近くに戻る', '近くの城'],
      ['/map', '地図に戻る', '地図'],
    ])('%s から開いた詳細画面は「戻る」でその画面に戻る', async (from, linkName, heading) => {
      renderApp(undefined, { pathname: '/castles/59', state: { from } })
      await userEvent.click(await screen.findByRole('link', { name: linkName }))
      expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument()
    })

    it('URL で直接開いた詳細画面は「戻る」で一覧に戻る', async () => {
      renderApp(undefined, '/castles/59')
      expect(await screen.findByRole('link', { name: '一覧に戻る' })).toHaveAttribute('href', '/')
    })

    it('知らない戻り先が渡されたら一覧に戻る', async () => {
      renderApp(undefined, { pathname: '/castles/59', state: { from: '/castles/1' } })
      expect(await screen.findByRole('link', { name: '一覧に戻る' })).toHaveAttribute('href', '/')
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
      expect(screen.getByLabelText('押印日')).toHaveValue('2026-09-30')
      expect(await repository.load()).toEqual({ 59: { stampedOn: '2026-09-30', memo: '' } })
    })

    it('OFF にすると押印日が消え、すぐ保存される', async () => {
      const repository = new InMemoryStampBookRepository()
      await repository.saveRecord(59, { stampedOn: '2026-01-01', memo: 'メモ' })
      renderApp(repository, '/castles/59')
      expect(await stampedCheckbox()).toBeChecked()
      expect(screen.getByLabelText('押印日')).toHaveValue('2026-01-01')

      await userEvent.click(await stampedCheckbox())

      expect(await stampedCheckbox()).not.toBeChecked()
      expect(screen.queryByLabelText('押印日')).toBeNull()
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
      expect(screen.queryByLabelText('押印日')).toBeNull()
    })
  })

  describe('詳細画面で押印日を変更する', () => {
    async function renderStamped() {
      const repository = new InMemoryStampBookRepository()
      await repository.saveRecord(59, { stampedOn: '2026-09-01', memo: '' })
      renderApp(repository, '/castles/59')
      const dateInput = await screen.findByLabelText<HTMLInputElement>('押印日')
      return { repository, dateInput }
    }

    it('日付入力で選べるのは今日まで', async () => {
      const { dateInput } = await renderStamped()
      expect(dateInput).toHaveAttribute('type', 'date')
      expect(dateInput).toHaveAttribute('max', '2026-09-30')
    })

    it('変更した日付がすぐ保存される', async () => {
      const { repository, dateInput } = await renderStamped()
      fireEvent.change(dateInput, { target: { value: '2026-05-05' } })

      expect(dateInput).toHaveValue('2026-05-05')
      await waitFor(async () =>
        expect(await repository.load()).toEqual({ 59: { stampedOn: '2026-05-05', memo: '' } }),
      )
    })

    it.each([
      ['未来の日付', '2026-10-01'],
      ['空欄', ''],
    ])('%s にしようとしても押印日は変わらない', async (_, value) => {
      const { repository, dateInput } = await renderStamped()
      fireEvent.change(dateInput, { target: { value } })

      expect(dateInput).toHaveValue('2026-09-01')
      expect(await repository.load()).toEqual({ 59: { stampedOn: '2026-09-01', memo: '' } })
    })
  })

  describe('詳細画面でメモを書く', () => {
    it('書いたメモは一覧に戻ると保存されていて、開き直すと表示される', async () => {
      const repository = new InMemoryStampBookRepository()
      renderApp(repository, '/castles/59')
      await userEvent.type(await screen.findByRole('textbox', { name: 'メモ' }), '白鷺城')
      await userEvent.click(screen.getByRole('link', { name: '一覧に戻る' }))

      await waitFor(async () =>
        expect(await repository.load()).toEqual({ 59: { stampedOn: null, memo: '白鷺城' } }),
      )
      await userEvent.click(screen.getByRole('link', { name: /姫路城/ }))
      expect(screen.getByRole('textbox', { name: 'メモ' })).toHaveValue('白鷺城')
    })

    it('別の城を開くとその城のメモを表示する', async () => {
      const repository = new InMemoryStampBookRepository()
      await repository.saveRecord(59, { stampedOn: null, memo: '姫路のメモ' })
      renderApp(repository, '/castles/59')
      expect(await screen.findByRole('textbox', { name: 'メモ' })).toHaveValue('姫路のメモ')

      await userEvent.click(screen.getByRole('link', { name: '一覧に戻る' }))
      await userEvent.click(screen.getByRole('link', { name: /首里城/ }))
      expect(screen.getByRole('textbox', { name: 'メモ' })).toHaveValue('')
    })

    it('保存に失敗しても書いた文字は消えず、入力欄から離れると保存し直す', async () => {
      const repository = new InMemoryStampBookRepository()
      const save = repository.saveRecord.bind(repository)
      let failNext = true
      repository.saveRecord = (n, r) => {
        if (failNext) {
          failNext = false
          return Promise.reject(new Error('quota exceeded'))
        }
        return save(n, r)
      }
      renderApp(repository, '/castles/59')
      const memo = await screen.findByRole('textbox', { name: 'メモ' })

      await userEvent.type(memo, '白鷺城')
      await userEvent.tab()
      expect(await screen.findByRole('alert')).toHaveTextContent('保存できませんでした')
      expect(memo).toHaveValue('白鷺城')
      expect(await repository.load()).toEqual({})

      await userEvent.click(memo)
      await userEvent.tab()
      await waitFor(async () =>
        expect(await repository.load()).toEqual({ 59: { stampedOn: null, memo: '白鷺城' } }),
      )
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })
})
