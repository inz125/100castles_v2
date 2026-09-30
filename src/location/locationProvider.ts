import type { LatLng } from '../domain/distance'

export type LocationResult =
  | { status: 'ok'; position: LatLng }
  /** 位置情報の利用が許可されていない */
  | { status: 'denied' }
  /** 電波が届かない・時間切れ・Geolocation が使えないなど */
  | { status: 'failed' }

/** 現在地を取得する窓口（テストでは偽物に差し替える） */
export type LocationProvider = {
  getCurrentPosition(): Promise<LocationResult>
}

/**
 * 近くの城を探すには数百 m の精度で足りるため、高精度（GPS 待ち）は使わず速さを優先する。
 * 1 分以内に取得した位置があれば使い回す。
 */
export const LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 60_000,
}

// GeolocationPositionError.PERMISSION_DENIED（テスト環境にはこの定数がないため数値で持つ）
const PERMISSION_DENIED = 1

/** ブラウザの Geolocation を使う窓口。使えない環境では undefined を渡す */
export function createGeolocationProvider(geolocation: Geolocation | undefined): LocationProvider {
  return {
    getCurrentPosition: () =>
      new Promise((resolve) => {
        if (!geolocation) {
          resolve({ status: 'failed' })
          return
        }
        try {
          geolocation.getCurrentPosition(
            ({ coords }) =>
              resolve({
                status: 'ok',
                position: { latitude: coords.latitude, longitude: coords.longitude },
              }),
            (error) => resolve({ status: error.code === PERMISSION_DENIED ? 'denied' : 'failed' }),
            LOCATION_OPTIONS,
          )
        } catch {
          resolve({ status: 'failed' })
        }
      }),
  }
}
