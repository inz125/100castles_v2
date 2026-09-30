import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { castles } from '../domain/castles'
import { getRecord, type StampBook } from '../domain/stampBook'
import { isStamped } from '../domain/stampRecord'

/** 国土地理院の標準地図タイル */
const GSI_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
const GSI_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院</a>'
/** 標準地図が提供されている最大の拡大率 */
const GSI_MAX_ZOOM = 18

/** 日本全体が収まる表示 */
const JAPAN_CENTER: L.LatLngTuple = [36.5, 137.5]
const JAPAN_ZOOM = 5

/** ピンのタップ領域（見た目の点は CSS でこれより小さく描く） */
const PIN_SIZE = 28

const pinIcon = (stamped: boolean) =>
  L.divIcon({
    className: `map-pin ${stamped ? 'map-pin--stamped' : 'map-pin--unstamped'}`,
    iconSize: [PIN_SIZE, PIN_SIZE],
  })

type Props = {
  book: StampBook
}

/** 地図タブ：100 城すべてをピンで表示する（絞り込みなし） */
export function MapPage({ book }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    const map = L.map(containerRef.current!, { center: JAPAN_CENTER, zoom: JAPAN_ZOOM })
    L.tileLayer(GSI_TILE_URL, { attribution: GSI_ATTRIBUTION, maxZoom: GSI_MAX_ZOOM }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // 記録が変わったらピンを立て直す（押印の状態で色が変わるため）
  useEffect(() => {
    const map = mapRef.current!
    const pins = L.layerGroup(
      castles.map((castle) =>
        L.marker([castle.latitude, castle.longitude], {
          icon: pinIcon(isStamped(getRecord(book, castle.number))),
          title: castle.name,
        }),
      ),
    ).addTo(map)
    return () => {
      pins.remove()
    }
  }, [book])

  return (
    <section className="map-page">
      <h2 className="visually-hidden">地図</h2>
      <div ref={containerRef} className="map" role="region" aria-label="城の地図" />
    </section>
  )
}
