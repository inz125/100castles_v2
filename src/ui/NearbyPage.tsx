import { useEffect, useState } from 'react'
import type { LocationProvider, LocationResult } from '../location/locationProvider'

type Props = {
  locationProvider: LocationProvider
}

type LocationState = { status: 'loading' } | LocationResult

const DENIED_MESSAGE =
  '位置情報の利用が許可されていません。' +
  'iPhone の『設定』→『プライバシーとセキュリティ』→『位置情報サービス』→『Safari Webサイト』を' +
  '『使用中のみ』にしてから、『更新』を押してください。'

/** 近くタブ：開いたときに現在地を取得する */
export function NearbyPage({ locationProvider }: Props) {
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
      <h2 className="page__title">近くの城</h2>
      <LocationMessage location={location} />
      {/* 近い順の一覧は 9-3 で作る */}
      {location.status === 'ok' && <div data-testid="nearby-ready" />}
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
