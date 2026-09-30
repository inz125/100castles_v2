import type { LatLng } from '../domain/distance'

/** 地図の表示位置（中心と拡大率）を覚えておくキー（表示の好みなので記録帳とは別に保存する） */
export const MAP_VIEW_STORAGE_KEY = 'castles100.mapView'

export type MapView = LatLng & { zoom: number }

const inRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max

/** 保存がない・読めないときは null */
export function loadMapView(storage: Storage): MapView | null {
  try {
    const raw = storage.getItem(MAP_VIEW_STORAGE_KEY)
    if (raw === null) return null
    const { latitude, longitude, zoom } = (JSON.parse(raw) ?? {}) as Partial<
      Record<string, unknown>
    >
    if (!inRange(latitude, -90, 90) || !inRange(longitude, -180, 180) || !inRange(zoom, 0, 20)) {
      return null
    }
    return { latitude, longitude, zoom }
  } catch {
    return null
  }
}

export function saveMapView(storage: Storage, view: MapView): void {
  try {
    storage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify(view))
  } catch {
    // 保存できなくても地図は使えるので無視する
  }
}
