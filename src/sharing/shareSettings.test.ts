import { beforeEach, describe, expect, it } from 'vitest'
import { generateShareCode } from '../domain/shareCode'
import { loadShareSettings, saveShareSettings, SHARE_SETTINGS_STORAGE_KEY } from './shareSettings'

beforeEach(() => {
  localStorage.clear()
})

describe('共有の設定', () => {
  it('保存がなければ null（共有していない）', () => {
    expect(loadShareSettings(localStorage)).toBeNull()
  })

  it('共有コードを保存して読み込める', () => {
    const code = generateShareCode()
    saveShareSettings(localStorage, { code })
    expect(loadShareSettings(localStorage)).toEqual({ code })
  })

  it.each([
    ['JSON でない', 'broken'],
    ['null', 'null'],
    ['コードがない', '{}'],
    ['コードの形式が違う', JSON.stringify({ code: 'ABC' })],
    ['区切り付きのコード', JSON.stringify({ code: 'ABCD-2345-EFGH' })],
  ])('%s データなら null', (_, raw) => {
    localStorage.setItem(SHARE_SETTINGS_STORAGE_KEY, raw)
    expect(loadShareSettings(localStorage)).toBeNull()
  })

  it('ストレージが読めなければ null', () => {
    const broken = {
      getItem: () => {
        throw new Error('unavailable')
      },
    } as unknown as Storage
    expect(loadShareSettings(broken)).toBeNull()
  })

  it('保存できなければ例外にする（共有を始めたことを覚えられないと記録が分かれてしまうため）', () => {
    const broken = {
      setItem: () => {
        throw new Error('quota exceeded')
      },
    } as unknown as Storage
    expect(() => saveShareSettings(broken, { code: generateShareCode() })).toThrow('quota exceeded')
  })
})
