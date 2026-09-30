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
import { StampMark } from './StampMark'

type Props = {
  locationProvider: LocationProvider
  book: StampBook
  filter: StampFilter
  onFilterChange: (filter: StampFilter) => void
}

type LocationState = { status: 'loading' } | LocationResult

const DENIED_MESSAGE =
  '位置情報の利用が許可されていません。' +
  'iPhone の『設定』→『プライバシーとセキュリティ』→『位置情報サービス』→『Safari Webサイト』を' +
  '『使用中のみ』にしてから、『更新』を押してください。'

/** 近くタブ：開いたときに現在地を取得し、城を近い順に並べる */
export function NearbyPage({ locationProvider, book, filter, onFilterChange }: Props) {
  const [location, setLocation] = useState<LocationState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    locationProvider.getCurrentPosition().then((result) => !cancelled && setLocation(result))
    return () => {
      cancelled = true
    }
  }, [locationProvider])

  return (
    <section className="page">
      <div className="list-toolbar">
        <h2 className="page__title">近くの城</h2>
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
      return (
        <p role="alert" className="alert">
          {DENIED_MESSAGE}
        </p>
      )
    case 'failed':
      return (
        <p role="alert" className="alert">
          現在地を取得できませんでした。電波の届く場所で『更新』を押してください。
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
