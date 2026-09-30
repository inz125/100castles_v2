/** 緯度経度（度）。城マスタも Geolocation の coords もこの形を満たす */
export type LatLng = {
  latitude: number
  longitude: number
}

/** 地球の平均半径（m） */
const EARTH_RADIUS_M = 6_371_000

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** 2 点間の直線距離（大圏距離、m）。ハーバサイン公式 */
export function distanceInMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}
