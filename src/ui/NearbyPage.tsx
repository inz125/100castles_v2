import { useEffect, useState } from 'react'
import { castles } from '../domain/castles'
import type { LatLng } from '../domain/distance'
import { formatDistance } from '../domain/formatDistance'
import { sortByDistance } from '../domain/nearby'
import { filterCastles, getRecord, type StampBook, type StampFilter } from '../domain/stampBook'
import { isStamped } from '../domain/stampRecord'
import type { LocationProvider, LocationResult } from '../location/locationProvider'
import { CastleLink } from './castleLinks'
import { FilterControl } from './FilterControl'
import { locationErrorMessage } from './locationMessages'
import { StampMark } from './StampMark'

type Props = {
  locationProvider: LocationProvider
  book: StampBook
  filter: StampFilter
  onFilterChange: (filter: StampFilter) => void
}

type LocationState = { status: 'loading' } | LocationResult

/** 近くタブ：開いたときに現在地を取得し、城を近い順に並べる */
export function NearbyPage({ locationProvider, book, filter, onFilterChange }: Props) {
  const [location, setLocation] = useState<LocationState>({ status: 'loading' })
  // 「更新」を押すたびに増やし、現在地を取り直すきっかけにする
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    locationProvider.getCurrentPosition().then((result) => !cancelled && setLocation(result))
    return () => {
      cancelled = true
    }
  }, [locationProvider, requestCount])

  const refresh = () => {
    setLocation({ status: 'loading' })
    setRequestCount((n) => n + 1)
  }

  return (
    <section className="page">
      <div className="list-toolbar">
        <div className="page__header">
          <h2 className="page__title">近くの城</h2>
          <button
            type="button"
            className="text-button"
            onClick={refresh}
            disabled={location.status === 'loading'}
          >
            更新
          </button>
        </div>
        <FilterControl filter={filter} onFilterChange={onFilterChange} />
      </div>
      <LocationMessage location={location} />
      {location.status === 'ok' && (
        <NearbyList here={location.position} book={book} filter={filter} />
      )}
    </section>
  )
}

function LocationMessage({ location }: { location: LocationState }) {
  switch (location.status) {
    case 'loading':
      return (
        <p role="status" className="empty">
          現在地を取得しています…
        </p>
      )
    case 'denied':
    case 'failed':
      return (
        <p role="alert" className="alert">
          {locationErrorMessage(location.status, '更新')}
        </p>
      )
    case 'ok':
      return null
  }
}

type NearbyListProps = {
  here: LatLng
  book: StampBook
  filter: StampFilter
}

function NearbyList({ here, book, filter }: NearbyListProps) {
  const items = sortByDistance(filterCastles(castles, book, filter), here)
  if (items.length === 0) return <p className="empty">該当する城はありません</p>

  return (
    <ul className="castle-list nearby-list">
      {items.map(({ castle, distanceMeters }) => (
        <li key={castle.number}>
          <CastleLink castleNumber={castle.number} className="castle-row">
            <span className="castle-row__number">{castle.number}</span>
            <span className="castle-row__name">{castle.name}</span>
            <span className="castle-row__distance">{formatDistance(distanceMeters)}</span>
            <span className="castle-row__mark">
              {isStamped(getRecord(book, castle.number)) && <StampMark />}
            </span>
          </CastleLink>
        </li>
      ))}
    </ul>
  )
}
