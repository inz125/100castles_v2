import type { IsoDate } from './stampRecord'

/**
 * 端末の時刻（ローカル時刻）での日付を YYYY-MM-DD で返す。
 * toISOString() は UTC の日付になり、日本では朝 9 時より前だと前日になってしまうため使わない。
 */
export function toLocalIsoDate(date: Date): IsoDate {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
