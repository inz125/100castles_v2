import { beforeEach, describe, expect, it } from 'vitest'
import { LIST_FILTER, loadStampFilter, NEARBY_FILTER, saveStampFilter } from './filterPreference'

beforeEach(() => {
  localStorage.clear()
})

describe('絞り込みの保存', () => {
  it('保存がなければ、一覧は「すべて」、近くは「未押印」', () => {
    expect(loadStampFilter(localStorage, LIST_FILTER)).toBe('all')
    expect(loadStampFilter(localStorage, NEARBY_FILTER)).toBe('unstamped')
  })

  it.each(['all', 'unstamped', 'stamped'] as const)('%s を保存して読み込める', (filter) => {
    saveStampFilter(localStorage, LIST_FILTER, filter)
    expect(loadStampFilter(localStorage, LIST_FILTER)).toBe(filter)
  })

  it('一覧と近くの選択は別々に保存する', () => {
    saveStampFilter(localStorage, LIST_FILTER, 'stamped')
    saveStampFilter(localStorage, NEARBY_FILTER, 'all')
    expect(loadStampFilter(localStorage, LIST_FILTER)).toBe('stamped')
    expect(loadStampFilter(localStorage, NEARBY_FILTER)).toBe('all')
    expect(LIST_FILTER.key).not.toBe(NEARBY_FILTER.key)
  })

  it('知らない値が保存されていれば初期値', () => {
    localStorage.setItem(LIST_FILTER.key, 'unknown')
    localStorage.setItem(NEARBY_FILTER.key, 'unknown')
    expect(loadStampFilter(localStorage, LIST_FILTER)).toBe('all')
    expect(loadStampFilter(localStorage, NEARBY_FILTER)).toBe('unstamped')
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
    expect(loadStampFilter(broken, NEARBY_FILTER)).toBe('unstamped')
    expect(() => saveStampFilter(broken, NEARBY_FILTER, 'stamped')).not.toThrow()
  })
})
