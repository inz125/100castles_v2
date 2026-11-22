import { describe, expect, it, vi } from 'vitest'
import type { VisitBook } from '../domain/michinoekiVisits'
import type { MichinoekiVisitRepository } from './michinoekiVisitRepository'

/** MichinoekiVisitRepository の実装が満たすべき振る舞い。各実装のテストから呼び出して使う */
export function describeMichinoekiVisitRepositoryContract(
  name: string,
  createRepository: () => MichinoekiVisitRepository,
) {
  describe(`${name}（Repository の契約）`, () => {
    it('最初は空の訪問帳を返す', async () => {
      expect(await createRepository().load()).toEqual({})
    })

    it('保存した行った日を読み込める', async () => {
      const repo = createRepository()
      await repo.saveVisit(3, '2026-10-01')
      await repo.saveVisit(10, '2026-10-02')
      expect(await repo.load()).toEqual({ 3: '2026-10-01', 10: '2026-10-02' })
    })

    it('null を保存すると行っていないことになる', async () => {
      const repo = createRepository()
      await repo.saveVisit(3, '2026-10-01')
      await repo.saveVisit(3, null)
      expect(await repo.load()).toEqual({})
    })

    it('読み込んだ訪問帳を書き換えても保存内容は変わらない', async () => {
      const repo = createRepository()
      await repo.saveVisit(3, '2026-10-01')
      const loaded = (await repo.load()) as Record<number, string>
      loaded[3] = '2000-01-01'
      expect(await repo.load()).toEqual({ 3: '2026-10-01' })
    })

    describe('変更の購読', () => {
      it('保存すると、購読している相手に新しい訪問帳が届く', async () => {
        const repo = createRepository()
        const listener = vi.fn<(visits: VisitBook) => void>()
        repo.subscribe(listener)

        await repo.saveVisit(3, '2026-10-01')
        await vi.waitFor(() => expect(listener).toHaveBeenLastCalledWith({ 3: '2026-10-01' }))

        await repo.saveVisit(3, null)
        await vi.waitFor(() => expect(listener).toHaveBeenLastCalledWith({}))
      })

      it('購読をやめると届かなくなる', async () => {
        const repo = createRepository()
        const listener = vi.fn<(visits: VisitBook) => void>()
        repo.subscribe(listener)()
        listener.mockClear()

        await repo.saveVisit(3, '2026-10-01')
        expect(listener).not.toHaveBeenCalled()
      })

      it('届いた訪問帳を書き換えても保存内容は変わらない', async () => {
        const repo = createRepository()
        let received: Record<number, string> = {}
        repo.subscribe((visits) => (received = visits as Record<number, string>))
        await repo.saveVisit(3, '2026-10-01')
        await vi.waitFor(() => expect(received[3]).toBeDefined())

        received[3] = '2000-01-01'
        expect(await repo.load()).toEqual({ 3: '2026-10-01' })
      })
    })
  })
}
