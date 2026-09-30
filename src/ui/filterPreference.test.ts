import { beforeEach, describe, expect, it } from 'vitest'
import { FILTER_STORAGE_KEY, loadStampFilter, saveStampFilter } from './filterPreference'

beforeEach(() => {
  localStorage.clear()
})

describe('絞り込みの保存', () => {
  it('保存がなければ「すべて」', () => {
    expect(loadStampFilter(localStorage)).toBe('all')
  })

  it.each(['all', 'unstamped', 'stamped'] as const)('%s を保存して読み込める', (filter) => {
    saveStampFilter(localStorage, filter)
    expect(loadStampFilter(localStorage)).toBe(filter)
  })

  it('知らない値が保存されていれば「すべて」', () => {
    localStorage.setItem(FILTER_STORAGE_KEY, 'unknown')
    expect(loadStampFilter(localStorage)).toBe('all')
  })

  it('ストレージが使えなくても例外にしない', () => {
    const broken = {
      getItem: () => {
        throw new Error('unavailable')
      },
      setItem: () => {
        throw new Error('unavailable')
      },
    } as unknown as Storage
    expect(loadStampFilter(broken)).toBe('all')
    expect(() => saveStampFilter(broken, 'stamped')).not.toThrow()
  })
})
