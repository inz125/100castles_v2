import { describe, expect, it, vi } from 'vitest'
import { generateShareCode } from '../domain/shareCode'
import type { VisitBook } from '../domain/michinoekiVisits'
import type { StampBook } from '../domain/stampBook'
import { describeMichinoekiVisitRepositoryContract } from '../repository/michinoekiVisitRepository.contract'
import { describeStampBookRepositoryContract } from '../repository/stampBookRepository.contract'
import { BookAlreadyExistsError, type CloudBookStore } from './cloudBookStore'

/**
 * CloudBookStore の実装が満たすべき振る舞い。
 * 各実装のテストから呼び出して使う。
 */
export function describeCloudBookStoreContract(name: string, createStore: () => CloudBookStore) {
  describe(`${name}（CloudBookStore の契約）`, () => {
    it('作っていないコードの記録帳はない', async () => {
      expect(await createStore().exists(generateShareCode())).toBe(false)
    })

    it('記録帳を作ると、あることが分かり、渡した記録が入っている', async () => {
      const store = createStore()
      const code = generateShareCode()
      const book: StampBook = {
        1: { stampedOn: null, memo: 'いつか行く' },
        59: { stampedOn: '2026-09-30', memo: '白鷺城' },
      }
      await store.create(code, book)
      expect(await store.exists(code)).toBe(true)
      expect(await store.open(code).load()).toEqual(book)
    })

    it('同じコードの記録帳は二度作れない（中身は変わらない）', async () => {
      const store = createStore()
      const code = generateShareCode()
      await store.create(code, { 59: { stampedOn: '2026-09-30', memo: '' } })
      await expect(store.create(code, {})).rejects.toThrow(BookAlreadyExistsError)
      expect(await store.open(code).load()).toEqual({ 59: { stampedOn: '2026-09-30', memo: '' } })
    })

    it('記録帳どうしは混ざらない', async () => {
      const store = createStore()
      const [a, b] = [generateShareCode(), generateShareCode()]
      await store.create(a, {})
      await store.create(b, {})
      await store.open(a).saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
      expect(await store.open(b).load()).toEqual({})
    })

    it('同じコードで開いた 2 台の端末は、互いの変更を受け取る', async () => {
      const store = createStore()
      const code = generateShareCode()
      await store.create(code, {})
      const mine = store.open(code)
      const theirs = store.open(code)
      const listener = vi.fn<(book: StampBook) => void>()
      mine.subscribe(listener)

      await theirs.saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
      await vi.waitFor(() =>
        expect(listener).toHaveBeenLastCalledWith({ 59: { stampedOn: '2026-09-30', memo: '' } }),
      )
      expect(await mine.load()).toEqual({ 59: { stampedOn: '2026-09-30', memo: '' } })
    })

    it('保存した変更がクラウドに届くと、送信待ちはなくなる', async () => {
      const store = createStore()
      const code = generateShareCode()
      await store.create(code, {})
      const book = store.open(code)
      const listener = vi.fn<(pending: boolean) => void>()
      book.subscribePendingWrites(listener)

      await book.saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
      await vi.waitFor(() => expect(listener).toHaveBeenLastCalledWith(false))
    })

    describe('道の駅の訪問帳', () => {
      it('作ったばかりの記録帳の訪問帳は空', async () => {
        const store = createStore()
        const code = generateShareCode()
        await store.create(code, {})
        expect(await store.openVisits(code).load()).toEqual({})
      })

      it('同じコードで開いた 2 台の端末は、互いの変更を受け取る', async () => {
        const store = createStore()
        const code = generateShareCode()
        await store.create(code, {})
        const mine = store.openVisits(code)
        const listener = vi.fn<(visits: VisitBook) => void>()
        mine.subscribe(listener)

        await store.openVisits(code).saveVisit(3, '2026-10-01')
        await vi.waitFor(() => expect(listener).toHaveBeenLastCalledWith({ 3: '2026-10-01' }))
        expect(await mine.load()).toEqual({ 3: '2026-10-01' })
      })

      it('訪問帳と城の記録は混ざらない', async () => {
        const store = createStore()
        const code = generateShareCode()
        await store.create(code, { 3: { stampedOn: '2026-09-30', memo: '' } })
        await store.openVisits(code).saveVisit(59, '2026-10-01')
        expect(await store.open(code).load()).toEqual({ 3: { stampedOn: '2026-09-30', memo: '' } })
        expect(await store.openVisits(code).load()).toEqual({ 59: '2026-10-01' })
      })

      it('取り込むと、クラウドにまだ記録がない駅だけに端末の行った日が入る', async () => {
        const store = createStore()
        const code = generateShareCode()
        await store.create(code, {})
        const visits = store.openVisits(code)
        await visits.saveVisit(2, '2026-09-01')
        // もう 1 人が行っていないことにした駅
        await visits.saveVisit(3, '2026-09-02')
        await visits.saveVisit(3, null)

        await store.importVisits(code, { 1: '2026-10-01', 2: '2026-10-02', 3: '2026-10-03' })
        expect(await visits.load()).toEqual({ 1: '2026-10-01', 2: '2026-09-01' })
      })

      it('保存した変更がクラウドに届くと、送信待ちはなくなる', async () => {
        const store = createStore()
        const code = generateShareCode()
        await store.create(code, {})
        const visits = store.openVisits(code)
        const listener = vi.fn<(pending: boolean) => void>()
        visits.subscribePendingWrites(listener)

        await visits.saveVisit(3, '2026-10-01')
        await vi.waitFor(() => expect(listener).toHaveBeenLastCalledWith(false))
      })

      // 開いた訪問帳は、端末内の訪問帳と同じ契約を満たす（テストごとに新しいコードで開く）
      const visitStore = createStore()
      describeMichinoekiVisitRepositoryContract(`${name} で開いた訪問帳`, () =>
        visitStore.openVisits(generateShareCode()),
      )
    })

    // 開いた記録帳は、端末内の記録帳と同じ契約を満たす（テストごとに新しいコードで開く）
    const store = createStore()
    describeStampBookRepositoryContract(`${name} で開いた記録帳`, () =>
      store.open(generateShareCode()),
    )
  })
}
