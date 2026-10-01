import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, type InitialEntry } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { formatShareCode, type ShareCode } from './domain/shareCode'
import type { LocationProvider } from './location/locationProvider'
import { InMemoryStampBookRepository } from './repository/inMemoryStampBookRepository'
import { UnsupportedVersionError, type StampBookRepository } from './repository/stampBookRepository'
import type { CloudBookStore } from './sharing/cloudBookStore'
import { InMemoryCloudBookStore } from './sharing/inMemoryCloudBookStore'
import { loadShareSettings, saveShareSettings } from './sharing/shareSettings'
import { LIST_FILTER, NEARBY_FILTER } from './ui/filterPreference'

function failingRepository(error: unknown): StampBookRepository {
  return {
    load: () => Promise.reject(error),
    saveRecord: () => Promise.reject(error),
    subscribe: () => () => {},
  }
}

/** 現在地の取得が終わらない窓口（近くタブの中身は NearbyPage のテストで確かめる） */
const pendingLocation: LocationProvider = { getCurrentPosition: () => new Promise(() => {}) }

/** 日本時間の 2026-09-30 00:30（UTC ではまだ 9/29） */
const NOW = new Date(2026, 8, 30, 0, 30)

function renderApp(
  repository: StampBookRepository = new InMemoryStampBookRepository(),
  initialPath: InitialEntry = '/',
  locationProvider: LocationProvider = pendingLocation,
  cloud: CloudBookStore = new InMemoryCloudBookStore(),
) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App
        localRepository={repository}
        cloud={cloud}
        preferenceStorage={localStorage}
        locationProvider={locationProvider}
        now={() => NOW}
      />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('App：共有中', () => {
  const CODE = 'ABCD2345EFGH' as ShareCode

  async function sharedCloud() {
    const cloud = new InMemoryCloudBookStore()
    await cloud.create(CODE, { 59: { stampedOn: '2026-09-01', memo: '' } })
    saveShareSettings(localStorage, { code: CODE })
    return cloud
  }

  it('共有中なら、端末内ではなくクラウドの記録帳を表示する', async () => {
    const local = new InMemoryStampBookRepository()
    await local.saveRecord(1, { stampedOn: '2026-01-01', memo: '' })
    await local.saveRecord(2, { stampedOn: '2026-01-01', memo: '' })
    renderApp(local, '/', pendingLocation, await sharedCloud())

    expect(await screen.findByRole('img', { name: /^全体 1\/100/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /姫路城/ })).toContainElement(
      screen.getByRole('img', { name: '押印済み' }),
    )
  })

  it('共有中の変更はクラウドに保存し、端末内の記録は変えない', async () => {
    const local = new InMemoryStampBookRepository()
    const cloud = await sharedCloud()
    renderApp(local, '/castles/100', pendingLocation, cloud)
    await userEvent.click(await screen.findByRole('checkbox', { name: '押印済み' }))

    await waitFor(async () =>
      expect(await cloud.open(CODE).load()).toEqual({
        59: { stampedOn: '2026-09-01', memo: '' },
        100: { stampedOn: '2026-09-30', memo: '' },
      }),
    )
    expect(await local.load()).toEqual({})
  })

  describe('同期の状態', () => {
    const syncStatus = () => screen.getByRole('status', { name: '同期の状態' })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('一覧の見出しに同期の状態を表示し、送信待ち・オフラインに切り替わる', async () => {
      const cloud = await sharedCloud()
      renderApp(undefined, '/', pendingLocation, cloud)
      await screen.findByRole('img', { name: /^全体 1\/100/ })
      expect(syncStatus()).toHaveTextContent('同期済み')

      act(() => cloud.setPendingWrites(CODE, true))
      expect(syncStatus()).toHaveTextContent('送信待ち')

      const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
      act(() => {
        window.dispatchEvent(new Event('offline'))
      })
      expect(syncStatus()).toHaveTextContent('オフライン')

      onLine.mockReturnValue(true)
      act(() => {
        window.dispatchEvent(new Event('online'))
        cloud.setPendingWrites(CODE, false)
      })
      expect(syncStatus()).toHaveTextContent('同期済み')
    })

    it('共有画面にも同期の状態を表示する', async () => {
      renderApp(undefined, '/share', pendingLocation, await sharedCloud())
      expect(await screen.findByText('ABCD-2345-EFGH')).toBeInTheDocument()
      expect(syncStatus()).toHaveTextContent('同期済み')
    })

    it('共有していなければ表示しない', async () => {
      renderApp()
      await screen.findByRole('img', { name: /^全体 0\/100/ })
      expect(screen.queryByRole('status', { name: '同期の状態' })).toBeNull()
    })
  })

  it('もう 1 人の変更が、開き直さなくても画面に反映される', async () => {
    const cloud = await sharedCloud()
    renderApp(undefined, '/', pendingLocation, cloud)
    await screen.findByRole('img', { name: /^全体 1\/100/ })

    await cloud.open(CODE).saveRecord(100, { stampedOn: '2026-09-30', memo: '' })

    expect(await screen.findByRole('img', { name: /^全体 2\/100/ })).toBeInTheDocument()
  })
})

describe('App', () => {
  it('アプリ名を見出しとして表示する', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1, name: '100名城スタンプ帳' })).toBeInTheDocument()
  })

  it('読み込みが終わるまでは読み込み中と表示する', () => {
    renderApp({
      load: () => new Promise(() => {}),
      saveRecord: async () => {},
      subscribe: () => () => {},
    })
    expect(screen.getByText('読み込み中…')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('保存されている記録を読み込んで一覧に表示する', async () => {
    const repository = new InMemoryStampBookRepository()
    await repository.saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
    renderApp(repository)
    expect(await screen.findByRole('img', { name: /^全体 1\/100/ })).toBeInTheDocument()
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
      localStorage.setItem(LIST_FILTER.key, 'stamped')
      renderApp()
      expect(await screen.findByText('該当する城はありません')).toBeInTheDocument()
    })

    it('選んだ絞り込みを表示に反映し、保存する', async () => {
      renderApp()
      await userEvent.click(await screen.findByRole('button', { name: '押印済み' }))
      expect(screen.getByText('該当する城はありません')).toBeInTheDocument()
      expect(localStorage.getItem(LIST_FILTER.key)).toBe('stamped')
    })
  })

  describe('近くタブ', () => {
    // 松本駅付近
    const nearMatsumoto: LocationProvider = {
      getCurrentPosition: async () => ({
        status: 'ok',
        position: { latitude: 36.2308, longitude: 137.9642 },
      }),
    }

    it('絞り込みは一覧とは別に覚え、初期値は未押印', async () => {
      localStorage.setItem(LIST_FILTER.key, 'stamped')
      renderApp(undefined, '/nearby', nearMatsumoto)
      expect(await screen.findByRole('button', { name: '未押印' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )

      await userEvent.click(screen.getByRole('button', { name: 'すべて' }))
      expect(localStorage.getItem(NEARBY_FILTER.key)).toBe('all')
      expect(localStorage.getItem(LIST_FILTER.key)).toBe('stamped')
    })

    it('近くの一覧から開いた詳細画面は「近くに戻る」で近くの一覧に戻る', async () => {
      renderApp(undefined, '/nearby', nearMatsumoto)
      await userEvent.click(await screen.findByRole('link', { name: /松本城/ }))
      expect(screen.getByRole('heading', { level: 2, name: '松本城' })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('link', { name: '近くに戻る' }))
      expect(await screen.findByRole('link', { name: /松本城/ })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: '近くの城' })).toBeInTheDocument()
    })
  })

  describe('共有画面', () => {
    it('一覧の見出しの「共有」から共有画面を開き、「一覧に戻る」で一覧に戻る', async () => {
      renderApp()
      await screen.findByRole('img', { name: /^全体 0\/100/ })
      await userEvent.click(screen.getByRole('link', { name: '共有' }))
      expect(screen.getByRole('heading', { level: 2, name: '共有' })).toBeInTheDocument()
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)

      await userEvent.click(screen.getByRole('link', { name: '一覧に戻る' }))
      expect(screen.getAllByRole('listitem')).toHaveLength(100)
    })

    it.each(['/nearby', '/map', '/castles/59'])(
      '一覧以外（%s）には「共有」を出さない',
      async (path) => {
        renderApp(undefined, path)
        await screen.findByRole('heading', { level: 2 })
        expect(screen.queryByRole('link', { name: '共有' })).toBeNull()
      },
    )

    it('共有を始めると共有コードを表示し、それ以降の変更はクラウドの記録帳に入る', async () => {
      const local = new InMemoryStampBookRepository()
      await local.saveRecord(59, { stampedOn: '2026-09-01', memo: '' })
      const cloud = new InMemoryCloudBookStore()
      renderApp(local, '/share', pendingLocation, cloud)

      await userEvent.click(await screen.findByRole('button', { name: '共有を始める' }))
      const code = await waitFor(() => {
        const settings = loadShareSettings(localStorage)
        expect(settings).not.toBeNull()
        return settings!.code
      })
      expect(await screen.findByText(formatShareCode(code))).toBeInTheDocument()

      // もう 1 人の変更が届き、自分の変更はクラウドに入る
      await cloud.open(code).saveRecord(100, { stampedOn: '2026-09-30', memo: '' })
      await userEvent.click(screen.getByRole('link', { name: '一覧に戻る' }))
      expect(await screen.findByRole('img', { name: /^全体 2\/100/ })).toBeInTheDocument()
      await userEvent.click(screen.getByRole('link', { name: /首里城/ }))
      await userEvent.click(screen.getByRole('checkbox', { name: '押印済み' }))
      await waitFor(async () => expect((await cloud.open(code).load())[100]?.stampedOn).toBeNull())
      expect(await local.load()).toEqual({ 59: { stampedOn: '2026-09-01', memo: '' } })
    })

    it('共有コードで参加すると一覧に移り、共有の記録帳を表示する', async () => {
      const code = 'ABCD2345EFGH' as ShareCode
      const cloud = new InMemoryCloudBookStore()
      await cloud.create(code, {
        59: { stampedOn: '2026-09-01', memo: '' },
        100: { stampedOn: '2026-09-02', memo: '' },
      })
      renderApp(undefined, '/share', pendingLocation, cloud)

      await userEvent.type(
        await screen.findByRole('textbox', { name: '共有コード' }),
        'abcd-2345-efgh',
      )
      await userEvent.click(screen.getByRole('button', { name: '参加する' }))

      expect(await screen.findByRole('img', { name: /^全体 2\/100/ })).toBeInTheDocument()
      expect(loadShareSettings(localStorage)).toEqual({ code })
    })

    it('URL（/share）で直接開ける', async () => {
      renderApp(undefined, '/share')
      expect(await screen.findByRole('heading', { level: 2, name: '共有' })).toBeInTheDocument()
    })
  })

  describe('地図タブ', () => {
    it('ピンの吹き出しの「詳細を見る」で詳細画面を開き、「地図に戻る」で地図に戻る', async () => {
      renderApp(undefined, '/map')
      // ピンは地図を作ったあとの effect で立つので、現れるまで待つ
      const pin = await waitFor(() => {
        const found = [...document.querySelectorAll<HTMLElement>('.map-pin')].find(
          (p) => p.title === '姫路城',
        )
        expect(found).toBeDefined()
        return found!
      })
      fireEvent.click(pin)
      await userEvent.click(await screen.findByRole('link', { name: '詳細を見る' }))
      expect(screen.getByRole('heading', { level: 2, name: '姫路城' })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('link', { name: '地図に戻る' }))
      expect(await screen.findByRole('region', { name: '城の地図' })).toBeInTheDocument()
    })
  })

  describe('タブバー', () => {
    const tabBar = () => screen.getByRole('navigation', { name: 'タブ' })
    const tab = (name: string) => within(tabBar()).getByRole('link', { name })

    it('一覧・近く・地図のタブがあり、開いているタブが選択状態になる', async () => {
      renderApp()
      await screen.findByRole('img', { name: /^全体 0\/100/ })
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
      await screen.findByRole('img', { name: /^全体 0\/100/ })
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

      expect(screen.getByRole('img', { name: /^全体 1\/100/ })).toBeInTheDocument()
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
