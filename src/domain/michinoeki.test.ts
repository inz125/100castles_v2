import { describe, expect, it } from 'vitest'
import { castles } from './castles'
import { distanceInMeters } from './distance'
import { michinoeki, nearbyMichinoeki } from './michinoeki'

const castle = (name: string) => castles.find((c) => c.name === name)!

describe('道の駅マスタ', () => {
  it('番号は 1 から連番で重複しない', () => {
    expect(michinoeki.map((s) => s.id)).toEqual(michinoeki.map((_, i) => i + 1))
  })

  it('愛知・岐阜・三重・静岡・長野の駅で、緯度経度が中部の範囲に収まる', () => {
    const prefectures = ['愛知県', '岐阜県', '三重県', '静岡県', '長野県']
    const outside = michinoeki.filter(
      (s) =>
        !prefectures.includes(s.prefecture) ||
        s.latitude < 33.5 ||
        s.latitude > 36.7 ||
        s.longitude < 135.7 ||
        s.longitude > 139.2,
    )
    expect(outside).toEqual([])
  })

  it('長野県は南信地域の駅だけを持つ', () => {
    const nagano = michinoeki.filter((s) => s.prefecture === '長野県')
    expect(nagano).toHaveLength(18)
    // 北信・東信・中信の駅（白馬・軽井沢方面など）は含まない
    expect(nagano.map((s) => s.name)).not.toContain('白馬')
  })
})

describe('nearbyMichinoeki', () => {
  const inuyama = castle('犬山城')

  it('半径内の道の駅だけを、近い順に距離つきで返す', () => {
    const result = nearbyMichinoeki(inuyama, 20_000)
    expect(result.length).toBeGreaterThan(0)
    for (const { station, distanceMeters } of result) {
      expect(distanceMeters).toBe(distanceInMeters(inuyama, station))
      expect(distanceMeters).toBeLessThanOrEqual(20_000)
    }
    const distances = result.map((r) => r.distanceMeters)
    expect(distances).toEqual(distances.toSorted((a, b) => a - b))
  })

  it('半径を小さくすると件数が減る', () => {
    expect(nearbyMichinoeki(inuyama, 5_000).length).toBeLessThan(
      nearbyMichinoeki(inuyama, 30_000).length,
    )
  })

  it('半径ちょうどの距離も含む', () => {
    const [nearest] = nearbyMichinoeki(inuyama, 100_000)
    expect(nearbyMichinoeki(inuyama, nearest.distanceMeters)).toContainEqual(nearest)
  })

  it('対象外の地域の城には何も返さない', () => {
    expect(nearbyMichinoeki(castle('首里城'), 20_000)).toEqual([])
  })
})
