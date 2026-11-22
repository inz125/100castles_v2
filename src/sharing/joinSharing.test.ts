import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShareCode } from '../domain/shareCode'
import { InMemoryMichinoekiVisitRepository } from '../repository/inMemoryMichinoekiVisitRepository'
import { InMemoryCloudBookStore } from './inMemoryCloudBookStore'
import { joinSharing } from './joinSharing'
import { loadShareSettings } from './shareSettings'

const CODE = 'ABCD2345EFGH' as ShareCode

beforeEach(() => {
  localStorage.clear()
})

describe('joinSharing', () => {
  it('入力したコードの記録帳があれば参加し、共有の設定を保存する', async () => {
    const cloud = new InMemoryCloudBookStore()
    await cloud.create(CODE, {})

    const result = await joinSharing({ input: 'abcd-2345-efgh', cloud, storage: localStorage })

    expect(result).toEqual({ status: 'joined', code: CODE })
    expect(loadShareSettings(localStorage)).toEqual({ code: CODE })
  })

  it('コードの形式が違えば invalid（クラウドには問い合わせない）', async () => {
    const cloud = new InMemoryCloudBookStore()
    cloud.exists = () => Promise.reject(new Error('問い合わせてはいけない'))

    const result = await joinSharing({ input: 'ABCD-2345', cloud, storage: localStorage })

    expect(result).toEqual({ status: 'invalid' })
    expect(loadShareSettings(localStorage)).toBeNull()
  })

  it('コードの記録帳がなければ not-found', async () => {
    const result = await joinSharing({
      input: 'ABCD-2345-EFGH',
      cloud: new InMemoryCloudBookStore(),
      storage: localStorage,
    })

    expect(result).toEqual({ status: 'not-found' })
    expect(loadShareSettings(localStorage)).toBeNull()
  })

  it('クラウドに問い合わせられなければ失敗し、共有の設定は保存しない', async () => {
    const cloud = new InMemoryCloudBookStore()
    cloud.exists = () => Promise.reject(new Error('offline'))

    await expect(
      joinSharing({ input: 'ABCD-2345-EFGH', cloud, storage: localStorage }),
    ).rejects.toThrow('offline')
    expect(loadShareSettings(localStorage)).toBeNull()
  })

  it('端末の訪問帳のうち、クラウドにまだ記録がない駅だけを取り込む', async () => {
    const cloud = new InMemoryCloudBookStore()
    await cloud.create(CODE, {})
    await cloud.openVisits(CODE).saveVisit(2, '2026-09-01')
    const localVisits = new InMemoryMichinoekiVisitRepository()
    await localVisits.saveVisit(1, '2026-10-01')
    await localVisits.saveVisit(2, '2026-10-02')

    await joinSharing({ input: 'ABCD-2345-EFGH', cloud, localVisits, storage: localStorage })

    expect(await cloud.openVisits(CODE).load()).toEqual({ 1: '2026-10-01', 2: '2026-09-01' })
  })

  it('コードの記録帳がなければ訪問帳は取り込まない', async () => {
    const cloud = new InMemoryCloudBookStore()
    const importVisits = vi.spyOn(cloud, 'importVisits')
    await joinSharing({
      input: 'ABCD-2345-EFGH',
      cloud,
      localVisits: new InMemoryMichinoekiVisitRepository(),
      storage: localStorage,
    })
    expect(importVisits).not.toHaveBeenCalled()
  })
})
