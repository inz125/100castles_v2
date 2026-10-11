import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadMichinoekiVisible,
  MICHINOEKI_VISIBLE_STORAGE_KEY,
  saveMichinoekiVisible,
} from './michinoekiVisibilityPreference'

beforeEach(() => {
  localStorage.clear()
})

describe('地図の道の駅の表示設定', () => {
  it('保存がなければ表示する', () => {
    expect(loadMichinoekiVisible(localStorage)).toBe(true)
  })

  it('表示しない設定を保存して読み込める', () => {
    saveMichinoekiVisible(localStorage, false)
    expect(loadMichinoekiVisible(localStorage)).toBe(false)
    saveMichinoekiVisible(localStorage, true)
    expect(loadMichinoekiVisible(localStorage)).toBe(true)
  })

  it('読めないデータなら表示する', () => {
    localStorage.setItem(MICHINOEKI_VISIBLE_STORAGE_KEY, 'broken')
    expect(loadMichinoekiVisible(localStorage)).toBe(true)
  })

  it('保存できなくても例外にしない', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    } as unknown as Storage
    expect(loadMichinoekiVisible(broken)).toBe(true)
    expect(() => saveMichinoekiVisible(broken, false)).not.toThrow()
  })
})
