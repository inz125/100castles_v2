import michinoekiJson from '../data/michinoeki.json'
import { distanceInMeters, type LatLng } from './distance'

export type Michinoeki = {
  /** 1 から始まる連番（マスタ内の並び順） */
  id: number
  /** 「道の駅」を除いた名前 */
  name: string
  prefecture: string
  latitude: number
  longitude: number
}

export type MichinoekiWithDistance = {
  station: Michinoeki
  /** 基準点からの直線距離（m） */
  distanceMeters: number
}

/**
 * 中部ブロック「道の駅」連絡会の駅（愛知・岐阜・三重・静岡と長野の南信地域）。
 * 紙の「中部『道の駅』スタンプブック」の対象と同じ区分
 */
export const michinoeki: readonly Michinoeki[] = michinoekiJson as Michinoeki[]

/** 基準点から半径内（以内）の道の駅を、近い順に距離つきで返す（同じ距離なら番号順） */
export function nearbyMichinoeki(from: LatLng, radiusMeters: number): MichinoekiWithDistance[] {
  return michinoeki
    .map((station) => ({ station, distanceMeters: distanceInMeters(from, station) }))
    .filter((item) => item.distanceMeters <= radiusMeters)
    .toSorted((a, b) => a.distanceMeters - b.distanceMeters || a.station.id - b.station.id)
}
