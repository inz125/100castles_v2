import type { Castle } from './castles'
import { distanceInMeters, type LatLng } from './distance'

export type CastleWithDistance = {
  castle: Castle
  /** 現在地からの直線距離（m） */
  distanceMeters: number
}

/** 城を現在地から近い順に並べ、距離をつける（同じ距離なら番号順） */
export function sortByDistance(targets: readonly Castle[], from: LatLng): CastleWithDistance[] {
  return targets
    .map((castle) => ({ castle, distanceMeters: distanceInMeters(from, castle) }))
    .toSorted((a, b) => a.distanceMeters - b.distanceMeters || a.castle.number - b.castle.number)
}
