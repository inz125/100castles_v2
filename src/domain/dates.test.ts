import { describe, expect, it } from 'vitest'
import { toLocalIsoDate } from './dates'

describe('toLocalIsoDate', () => {
  it('端末の時刻（ローカル時刻）での日付を YYYY-MM-DD で返す', () => {
    expect(toLocalIsoDate(new Date(2026, 8, 30, 12, 0))).toBe('2026-09-30')
  })

  it('日付が変わった直後でもローカル時刻の日付になる（UTC の日付にならない）', () => {
    expect(toLocalIsoDate(new Date(2026, 8, 30, 0, 30))).toBe('2026-09-30')
    expect(toLocalIsoDate(new Date(2026, 8, 30, 23, 59))).toBe('2026-09-30')
  })

  it('月・日を 2 桁にそろえる', () => {
    expect(toLocalIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
