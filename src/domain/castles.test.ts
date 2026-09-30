import { describe, expect, it } from 'vitest'
import { castles, REGIONS } from './castles'

describe('城マスタ', () => {
  it('100城ある', () => {
    expect(castles).toHaveLength(100)
  })

  it('番号が 1〜100 で重複なく番号順に並んでいる', () => {
    expect(castles.map((c) => c.number)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1))
  })

  it('城名・都道府県が空でない', () => {
    for (const c of castles) {
      expect(c.name, `No.${c.number}`).not.toBe('')
      expect(c.prefecture, `No.${c.number}`).toMatch(/^(北海道|.+[都府県])$/)
    }
  })

  it('地方は 6 区分のいずれかで、番号順に区分の順序どおり並んでいる', () => {
    const regionIndexes = castles.map((c) => REGIONS.indexOf(c.region))
    expect(regionIndexes.every((i) => i >= 0)).toBe(true)
    expect(regionIndexes).toEqual([...regionIndexes].sort((a, b) => a - b))
  })

  it('各地方の区切りがスタンプ帳と一致する', () => {
    const firstNumberOf = (region: string) => castles.find((c) => c.region === region)?.number
    expect(REGIONS.map(firstNumberOf)).toEqual([1, 14, 33, 49, 63, 85])
  })

  it('代表的な城のデータが正しい', () => {
    expect(castles[0]).toEqual({
      number: 1,
      name: '根室半島チャシ跡群',
      prefecture: '北海道',
      region: '北海道・東北',
    })
    expect(castles[58]).toEqual({
      number: 59,
      name: '姫路城',
      prefecture: '兵庫県',
      region: '近畿',
    })
    expect(castles[99]).toEqual({
      number: 100,
      name: '首里城',
      prefecture: '沖縄県',
      region: '九州・沖縄',
    })
  })
})
