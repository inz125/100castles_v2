import { describe, expect, it } from 'vitest'
import { castles } from './castles'
import { distanceInMeters } from './distance'

describe('distanceInMeters', () => {
  it('同じ地点なら 0', () => {
    const p = { latitude: 35.6883, longitude: 139.7537 }
    expect(distanceInMeters(p, p)).toBe(0)
  })

  it('経線に沿って緯度 1 度は約 111.2km', () => {
    const a = { latitude: 35, longitude: 135 }
    const b = { latitude: 36, longitude: 135 }
    expect(distanceInMeters(a, b)).toBeCloseTo(111_195, -1)
  })

  it('向きによらず同じ距離', () => {
    const a = { latitude: 43.3503, longitude: 145.6317 }
    const b = { latitude: 26.2172, longitude: 127.7194 }
    expect(distanceInMeters(a, b)).toBe(distanceInMeters(b, a))
  })

  it('城どうしの距離（江戸城〜大阪城は約 400km）', () => {
    const edo = castles.find((c) => c.name === '江戸城')!
    const osaka = castles.find((c) => c.name === '大阪城')!
    const d = distanceInMeters(edo, osaka)
    expect(d).toBeGreaterThan(390_000)
    expect(d).toBeLessThan(410_000)
  })
})
