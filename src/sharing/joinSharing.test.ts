import { beforeEach, describe, expect, it } from 'vitest'
import type { ShareCode } from '../domain/shareCode'
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
})
