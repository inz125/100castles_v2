import { beforeEach, describe, expect, it } from 'vitest'
import { loadMapView, MAP_VIEW_STORAGE_KEY, saveMapView } from './mapViewPreference'

beforeEach(() => {
  localStorage.clear()
})

describe('地図の表示位置の保存', () => {
  it('保存がなければ null', () => {
    expect(loadMapView(localStorage)).toBeNull()
  })

  it('中心と拡大率を保存して読み込める', () => {
    const view = { latitude: 34.8394, longitude: 134.6939, zoom: 13 }
    saveMapView(localStorage, view)
    expect(loadMapView(localStorage)).toEqual(view)
  })

  it.each([
    ['JSON でない', 'broken'],
    ['項目が足りない', JSON.stringify({ latitude: 35, longitude: 135 })],
    ['数値でない', JSON.stringify({ latitude: '35', longitude: 135, zoom: 5 })],
    ['範囲外の緯度', JSON.stringify({ latitude: 95, longitude: 135, zoom: 5 })],
    ['範囲外の経度', JSON.stringify({ latitude: 35, longitude: 200, zoom: 5 })],
    ['範囲外の拡大率', JSON.stringify({ latitude: 35, longitude: 135, zoom: 30 })],
    ['null', 'null'],
  ])('%s データなら null', (_, raw) => {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, raw)
    expect(loadMapView(localStorage)).toBeNull()
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
    expect(loadMapView(broken)).toBeNull()
    expect(() => saveMapView(broken, { latitude: 35, longitude: 135, zoom: 5 })).not.toThrow()
  })
})
