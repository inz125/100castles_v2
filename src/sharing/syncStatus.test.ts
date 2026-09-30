import { describe, expect, it } from 'vitest'
import { SYNC_STATUS_LABELS, syncStatusOf } from './syncStatus'

describe('syncStatusOf', () => {
  it.each([
    [{ online: true, pendingWrites: false }, 'synced'],
    [{ online: true, pendingWrites: true }, 'pending'],
    // 電波がないときは送信待ちがあってもなくてもオフライン（つながれば送られる）
    [{ online: false, pendingWrites: true }, 'offline'],
    [{ online: false, pendingWrites: false }, 'offline'],
  ] as const)('%o なら %s', (state, expected) => {
    expect(syncStatusOf(state)).toBe(expected)
  })

  it('表示の文言', () => {
    expect(SYNC_STATUS_LABELS).toEqual({
      synced: '同期済み',
      pending: '送信待ち',
      offline: 'オフライン',
    })
  })
})
