import { useId } from 'react'
import type { Castle } from '../domain/castles'
import { formatDistance } from '../domain/formatDistance'
import { nearbyMichinoeki } from '../domain/michinoeki'

/** 城の周辺とみなす距離（m） */
const NEARBY_RADIUS_M = 20_000

/** 城の周辺にある道の駅を近い順に並べる。なければ何も表示しない（対象地域の外の城など） */
export function NearbyMichinoeki({ castle }: { castle: Castle }) {
  const headingId = useId()
  const items = nearbyMichinoeki(castle, NEARBY_RADIUS_M)
  if (items.length === 0) return null

  return (
    <section className="card michinoeki" aria-labelledby={headingId}>
      <h3 id={headingId} className="michinoeki__heading">
        近くの道の駅
      </h3>
      <ul className="michinoeki__list">
        {items.map(({ station, distanceMeters }) => (
          <li key={station.id} className="michinoeki__item">
            <span className="michinoeki__name">道の駅 {station.name}</span>
            <span className="michinoeki__distance">{formatDistance(distanceMeters)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
