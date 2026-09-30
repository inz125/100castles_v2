import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { castles, type Castle } from '../domain/castles'
import { getRecord, type StampBook } from '../domain/stampBook'
import { isStamped, type StampRecord } from '../domain/stampRecord'
import { CastleLink } from './castleLinks'

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
  // 吹き出しを開いている城の番号
  const [selected, setSelected] = useState<number | null>(null)
  // 吹き出しの中身は React で描き、Leaflet の吹き出しにはこの要素を渡す
  const [popupContent] = useState(() => document.createElement('div'))

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
        }).on('click', () => setSelected(castle.number)),
      ),
    ).addTo(map)
    return () => {
      pins.remove()
    }
  }, [book])

  // 中身を描いたあとで吹き出しを開く（開くときに中身の大きさで位置を決めるため）
  useEffect(() => {
    const castle = castles.find((c) => c.number === selected)
    if (!castle) return
    const popup = L.popup({ offset: [0, -PIN_SIZE / 2 + 4] })
      .setLatLng([castle.latitude, castle.longitude])
      .setContent(popupContent)
      .openOn(mapRef.current!)
    // ×ボタンや地図のタップで閉じられたら、選択も外す
    const onRemove = () => setSelected((current) => (current === castle.number ? null : current))
    popup.on('remove', onRemove)
    return () => {
      popup.off('remove', onRemove)
      popup.remove()
    }
  }, [selected, popupContent])

  const selectedCastle = castles.find((c) => c.number === selected)

  return (
    <section className="map-page">
      <h2 className="visually-hidden">地図</h2>
      <div ref={containerRef} className="map" role="region" aria-label="城の地図" />
      {selectedCastle &&
        createPortal(
          <CastlePopup castle={selectedCastle} record={getRecord(book, selectedCastle.number)} />,
          popupContent,
        )}
    </section>
  )
}

function CastlePopup({ castle, record }: { castle: Castle; record: StampRecord }) {
  return (
    <div role="dialog" aria-label={`${castle.name}の情報`} className="map-popup">
      <p className="map-popup__number">No.{castle.number}</p>
      <p className="map-popup__name">{castle.name}</p>
      <p className="map-popup__status">
        {isStamped(record) ? `押印済み（${record.stampedOn}）` : '未押印'}
      </p>
      <CastleLink castleNumber={castle.number} className="map-popup__link">
        詳細を見る
      </CastleLink>
    </div>
  )
}
