import { describe, expect, it, vi } from 'vitest'
import type { StampBook } from '../domain/stampBook'
import type { StampBookRepository } from './stampBookRepository'

/**
 * StampBookRepository の実装が満たすべき振る舞い。
 * 各実装のテストから呼び出して使う。
 */
export function describeStampBookRepositoryContract(
  name: string,
  createRepository: () => StampBookRepository,
) {
  describe(`${name}（Repository の契約）`, () => {
    it('最初は空の記録帳を返す', async () => {
      expect(await createRepository().load()).toEqual({})
    })

    it('保存した記録を読み込める', async () => {
      const repo = createRepository()
      await repo.saveRecord(59, { stampedOn: '2026-09-30', memo: '白鷺城' })
      await repo.saveRecord(1, { stampedOn: null, memo: 'いつか行く' })
      expect(await repo.load()).toEqual({
        1: { stampedOn: null, memo: 'いつか行く' },
        59: { stampedOn: '2026-09-30', memo: '白鷺城' },
      })
    })

    it('同じ城を保存すると上書きする', async () => {
      const repo = createRepository()
      await repo.saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
      await repo.saveRecord(59, { stampedOn: null, memo: 'やっぱり未押印' })
      expect(await repo.load()).toEqual({ 59: { stampedOn: null, memo: 'やっぱり未押印' } })
    })

    it('読み込んだ記録帳を書き換えても保存内容は変わらない', async () => {
      const repo = createRepository()
      await repo.saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
      const loaded = (await repo.load()) as Record<number, unknown>
      loaded[59] = { stampedOn: null, memo: '書き換え' }
      expect(await repo.load()).toEqual({ 59: { stampedOn: '2026-09-30', memo: '' } })
    })

    it('保存に渡した記録を後から書き換えても保存内容は変わらない', async () => {
      const repo = createRepository()
      const record = { stampedOn: '2026-09-30', memo: '' }
      await repo.saveRecord(59, record)
      record.memo = '書き換え'
      expect(await repo.load()).toEqual({ 59: { stampedOn: '2026-09-30', memo: '' } })
    })

    describe('変更の購読', () => {
      it('保存すると、購読している相手に新しい記録帳が届く', async () => {
        const repo = createRepository()
        const listener = vi.fn<(book: StampBook) => void>()
        repo.subscribe(listener)

        await repo.saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
        await vi.waitFor(() =>
          expect(listener).toHaveBeenLastCalledWith({ 59: { stampedOn: '2026-09-30', memo: '' } }),
        )

        await repo.saveRecord(1, { stampedOn: null, memo: 'いつか行く' })
        await vi.waitFor(() =>
          expect(listener).toHaveBeenLastCalledWith({
            1: { stampedOn: null, memo: 'いつか行く' },
            59: { stampedOn: '2026-09-30', memo: '' },
          }),
        )
      })

      it('購読をやめると届かなくなる', async () => {
        const repo = createRepository()
        const listener = vi.fn<(book: StampBook) => void>()
        const unsubscribe = repo.subscribe(listener)
        unsubscribe()
        listener.mockClear()

        await repo.saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
        expect(listener).not.toHaveBeenCalled()
      })

      it('届いた記録帳を書き換えても保存内容は変わらない', async () => {
        const repo = createRepository()
        let received: Record<number, unknown> = {}
        repo.subscribe((book) => (received = book as Record<number, unknown>))
        await repo.saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
        await vi.waitFor(() => expect(received[59]).toBeDefined())

        received[59] = { stampedOn: null, memo: '書き換え' }
        expect(await repo.load()).toEqual({ 59: { stampedOn: '2026-09-30', memo: '' } })
      })
    })
  })
}
