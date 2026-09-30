import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

/** 国土地理院の標準地図タイル */
const GSI_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
const GSI_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院</a>'
/** 標準地図が提供されている最大の拡大率 */
const GSI_MAX_ZOOM = 18

/** 日本全体が収まる表示 */
const JAPAN_CENTER: L.LatLngTuple = [36.5, 137.5]
const JAPAN_ZOOM = 5

/** 地図タブ */
export function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const map = L.map(containerRef.current!, { center: JAPAN_CENTER, zoom: JAPAN_ZOOM })
    L.tileLayer(GSI_TILE_URL, { attribution: GSI_ATTRIBUTION, maxZoom: GSI_MAX_ZOOM }).addTo(map)
    return () => {
      map.remove()
    }
  }, [])

  return (
    <section className="map-page">
      <h2 className="visually-hidden">地図</h2>
      <div ref={containerRef} className="map" role="region" aria-label="城の地図" />
    </section>
  )
}
