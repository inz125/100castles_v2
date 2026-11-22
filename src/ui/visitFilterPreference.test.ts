import { beforeEach, describe, expect, it } from 'vitest'
import { loadVisitFilter, saveVisitFilter, VISIT_FILTER_STORAGE_KEY } from './visitFilterPreference'

beforeEach(() => {
  localStorage.clear()
})

describe('道の駅タブの絞り込みの保存', () => {
  it('保存がなければ すべて', () => {
    expect(loadVisitFilter(localStorage)).toBe('all')
  })

  it('保存した選択を読み込める', () => {
    saveVisitFilter(localStorage, 'unvisited')
    expect(loadVisitFilter(localStorage)).toBe('unvisited')
  })

  it('知らない値なら すべて', () => {
    localStorage.setItem(VISIT_FILTER_STORAGE_KEY, 'stamped')
    expect(loadVisitFilter(localStorage)).toBe('all')
  })
})
