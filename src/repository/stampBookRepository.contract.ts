import { describe, expect, it } from 'vitest'
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
  })
}
