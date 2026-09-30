import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { castles, type Castle } from '../domain/castles'
import type { LatLng } from '../domain/distance'
import { getRecord, type StampBook } from '../domain/stampBook'
import { isStamped, type StampRecord } from '../domain/stampRecord'
import type { LocationProvider } from '../location/locationProvider'
import { CastleLink } from './castleLinks'
import { locationErrorMessage } from './locationMessages'
import { loadMapView, saveMapView } from './mapViewPreference'

/** 国土地理院の標準地図タイル */
const GSI_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
const GSI_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院</a>'
/** 標準地図が提供されている最大の拡大率 */
const GSI_MAX_ZOOM = 18

/**
 * 初めて開いたときの表示：100 城すべてが収まる範囲（北海道〜沖縄）。
 * 端のピンが画面の縁に掛からないよう、範囲を少し広げておく
 */
const ALL_CASTLES_BOUNDS = L.latLngBounds(
  castles.map((c): L.LatLngTuple => [c.latitude, c.longitude]),
).pad(0.05)

/** ピンのタップ領域（見た目の点は CSS でこれより小さく描く） */
const PIN_SIZE = 28

const pinIcon = (stamped: boolean) =>
  L.divIcon({
    className: `map-pin ${stamped ? 'map-pin--stamped' : 'map-pin--unstamped'}`,
    iconSize: [PIN_SIZE, PIN_SIZE],
  })

/** 現在地の点（青）。タップしても何も起きない */
const hereIcon = L.divIcon({ className: 'map-here', iconSize: [22, 22] })
/** 「現在地へ移動」で最低限ここまで拡大する（市町村が見える程度） */
const HERE_ZOOM = 12
const MOVE_LABEL = '現在地へ移動'

type Props = {
  book: StampBook
  locationProvider: LocationProvider
  /** 表示位置と拡大率を覚えておく先 */
  preferenceStorage: Storage
}

/** 地図タブ：100 城すべてをピンで表示する（絞り込みなし） */
export function MapPage({ book, locationProvider, preferenceStorage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  // 吹き出しを開いている城の番号
  const [selected, setSelected] = useState<number | null>(null)
  // 吹き出しの中身は React で描き、Leaflet の吹き出しにはこの要素を渡す
  const [popupContent] = useState(() => document.createElement('div'))
  const [here, setHere] = useState<LatLng | null>(null)
  const [locating, setLocating] = useState(true)
  // 「現在地へ移動」で取得できなかった理由（開いたときの取得の失敗は表示しない）
  const [moveError, setMoveError] = useState<'denied' | 'failed' | null>(null)
  // 画面を離れたあとに届いた結果を使わないため
  const mountedRef = useRef(false)

  // 開いたときに現在地を取りに行き、取得できたら点を表示する
  useEffect(() => {
    mountedRef.current = true
    locationProvider.getCurrentPosition().then((result) => {
      if (!mountedRef.current) return
      if (result.status === 'ok') setHere(result.position)
      setLocating(false)
    })
    return () => {
      mountedRef.current = false
    }
  }, [locationProvider])

  const moveToHere = async () => {
    setLocating(true)
    const result = await locationProvider.getCurrentPosition()
    if (!mountedRef.current) return
    setLocating(false)
    if (result.status !== 'ok') {
      setMoveError(result.status)
      return
    }
    setMoveError(null)
    setHere(result.position)
    const map = mapRef.current!
    map.setView(
      [result.position.latitude, result.position.longitude],
      Math.max(map.getZoom(), HERE_ZOOM),
    )
  }

  useEffect(() => {
    // 拡大率を 0.5 刻みにする（1 刻みだと、縦長の iPhone で日本全体を収めたとき小さくなりすぎる）
    const map = L.map(containerRef.current!, { zoomSnap: 0.5 })
    L.tileLayer(GSI_TILE_URL, { attribution: GSI_ATTRIBUTION, maxZoom: GSI_MAX_ZOOM }).addTo(map)
    // 動かすたびに表示位置を覚え、次に開いたときに使う
    map.on('moveend', () => {
      const center = map.getCenter()
      saveMapView(preferenceStorage, {
        latitude: center.lat,
        longitude: center.lng,
        zoom: map.getZoom(),
      })
    })
    const saved = loadMapView(preferenceStorage)
    if (saved) {
      map.setView([saved.latitude, saved.longitude], saved.zoom)
    } else {
      map.fitBounds(ALL_CASTLES_BOUNDS)
    }
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [preferenceStorage])

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

  useEffect(() => {
    if (!here) return
    const marker = L.marker([here.latitude, here.longitude], {
      icon: hereIcon,
      interactive: false,
      keyboard: false,
      // 城のピンより手前に出す
      zIndexOffset: 1000,
    }).addTo(mapRef.current!)
    return () => {
      marker.remove()
    }
  }, [here])

  const selectedCastle = castles.find((c) => c.number === selected)

  return (
    <section className="map-page">
      <h2 className="visually-hidden">地図</h2>
      <div ref={containerRef} className="map" role="region" aria-label="城の地図" />
      {moveError && (
        <p role="alert" className="alert map-alert">
          {locationErrorMessage(moveError, MOVE_LABEL)}
        </p>
      )}
      <button
        type="button"
        className="map-here-button"
        onClick={moveToHere}
        disabled={locating}
        aria-label={MOVE_LABEL}
      >
        <span aria-hidden="true">➤</span>
      </button>
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
