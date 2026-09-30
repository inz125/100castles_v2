import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShareCode } from '../domain/shareCode'
import { InMemoryStampBookRepository } from '../repository/inMemoryStampBookRepository'
import { InMemoryCloudBookStore } from './inMemoryCloudBookStore'
import { loadShareSettings } from './shareSettings'
import { startSharing } from './startSharing'

const CODE_A = 'AAAAAAAAAAAA' as ShareCode
const CODE_B = 'BBBBBBBBBBBB' as ShareCode

/** 渡した順にコードを返す */
const codesInOrder = (...codes: ShareCode[]) => {
  let i = 0
  return () => codes[i++]
}

beforeEach(() => {
  localStorage.clear()
})

describe('startSharing', () => {
  it('端末の記録をすべて入れた記録帳をクラウドに作り、共有コードを返す', async () => {
    const local = new InMemoryStampBookRepository()
    await local.saveRecord(59, { stampedOn: '2026-09-30', memo: '白鷺城' })
    await local.saveRecord(1, { stampedOn: null, memo: 'いつか行く' })
    const cloud = new InMemoryCloudBookStore()

    const code = await startSharing({
      local,
      cloud,
      storage: localStorage,
      generateCode: codesInOrder(CODE_A),
    })

    expect(code).toBe(CODE_A)
    expect(await cloud.open(CODE_A).load()).toEqual({
      1: { stampedOn: null, memo: 'いつか行く' },
      59: { stampedOn: '2026-09-30', memo: '白鷺城' },
    })
  })

  it('共有の設定を保存する（次に開いたときからクラウドの記録帳を使う）', async () => {
    await startSharing({
      local: new InMemoryStampBookRepository(),
      cloud: new InMemoryCloudBookStore(),
      storage: localStorage,
      generateCode: codesInOrder(CODE_A),
    })
    expect(loadShareSettings(localStorage)).toEqual({ code: CODE_A })
  })

  it('端末内の記録はそのまま残す', async () => {
    const local = new InMemoryStampBookRepository()
    await local.saveRecord(59, { stampedOn: '2026-09-30', memo: '' })
    await startSharing({
      local,
      cloud: new InMemoryCloudBookStore(),
      storage: localStorage,
      generateCode: codesInOrder(CODE_A),
    })
    expect(await local.load()).toEqual({ 59: { stampedOn: '2026-09-30', memo: '' } })
  })

  it('コードがすでに使われていたら、別のコードで作り直す', async () => {
    const cloud = new InMemoryCloudBookStore()
    await cloud.create(CODE_A, { 1: { stampedOn: null, memo: '他人の記録帳' } })

    const code = await startSharing({
      local: new InMemoryStampBookRepository(),
      cloud,
      storage: localStorage,
      generateCode: codesInOrder(CODE_A, CODE_B),
    })

    expect(code).toBe(CODE_B)
    expect(await cloud.open(CODE_A).load()).toEqual({
      1: { stampedOn: null, memo: '他人の記録帳' },
    })
  })

  it('何度作り直してもコードが使われていれば失敗する（共有の設定は保存しない）', async () => {
    const cloud = new InMemoryCloudBookStore()
    await cloud.create(CODE_A, {})
    const generateCode = vi.fn<() => ShareCode>(() => CODE_A)

    await expect(
      startSharing({
        local: new InMemoryStampBookRepository(),
        cloud,
        storage: localStorage,
        generateCode,
      }),
    ).rejects.toThrow('この共有コードの記録帳はすでにあります')
    expect(generateCode).toHaveBeenCalledTimes(3)
    expect(loadShareSettings(localStorage)).toBeNull()
  })

  it('クラウドに作れなければ失敗し、共有の設定は保存しない', async () => {
    const cloud = new InMemoryCloudBookStore()
    cloud.create = () => Promise.reject(new Error('offline'))

    await expect(
      startSharing({
        local: new InMemoryStampBookRepository(),
        cloud,
        storage: localStorage,
        generateCode: codesInOrder(CODE_A),
      }),
    ).rejects.toThrow('offline')
    expect(loadShareSettings(localStorage)).toBeNull()
  })
})
