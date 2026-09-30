import { describe, expect, it } from 'vitest'
import { castles, type Castle } from './castles'
import { distanceInMeters } from './distance'
import { sortByDistance } from './nearby'
import { filterCastles, type StampBook } from './stampBook'

const byName = (name: string) => castles.find((c) => c.name === name)!
const namesOf = (items: { castle: Castle }[]) => items.map((i) => i.castle.name)

describe('sortByDistance', () => {
  // 松本駅付近
  const here = { latitude: 36.2308, longitude: 137.9642 }

  it('現在地から近い順に並べ、距離をつける', () => {
    const targets = [byName('姫路城'), byName('松本城'), byName('上田城'), byName('首里城')]
    const sorted = sortByDistance(targets, here)
    expect(namesOf(sorted)).toEqual(['松本城', '上田城', '姫路城', '首里城'])
    expect(sorted[0].distanceMeters).toBe(distanceInMeters(here, byName('松本城')))
  })

  it('100 城すべてを近い順に並べられる', () => {
    const sorted = sortByDistance(castles, here)
    expect(sorted).toHaveLength(100)
    const distances = sorted.map((i) => i.distanceMeters)
    expect(distances).toEqual(distances.toSorted((a, b) => a - b))
  })

  it('同じ距離なら番号順', () => {
    const a = { ...byName('姫路城'), number: 60 }
    const b = { ...byName('姫路城'), number: 59 }
    expect(sortByDistance([a, b], here).map((i) => i.castle.number)).toEqual([59, 60])
  })

  it('元の配列は変えない', () => {
    const targets = [byName('姫路城'), byName('松本城')]
    sortByDistance(targets, here)
    expect(targets.map((c) => c.name)).toEqual(['姫路城', '松本城'])
  })

  it('絞り込みと組み合わせられる', () => {
    const book: StampBook = { [byName('松本城').number]: { stampedOn: '2026-09-30', memo: '' } }
    const sorted = sortByDistance(filterCastles(castles, book, 'unstamped'), here)
    expect(sorted).toHaveLength(99)
    expect(namesOf(sorted)).not.toContain('松本城')
    expect(sorted[0].castle.name).not.toBe('松本城')
  })
})
