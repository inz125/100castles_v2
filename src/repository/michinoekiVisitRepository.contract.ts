import { describe, expect, it } from 'vitest'
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
  })
}
