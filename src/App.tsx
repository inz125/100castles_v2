import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router'
import { castles } from './domain/castles'
import { toLocalIsoDate } from './domain/dates'
import { getRecord, type StampBook, type StampFilter } from './domain/stampBook'
import type { IsoDate, StampRecord } from './domain/stampRecord'
import type { LocationProvider } from './location/locationProvider'
import { UnsupportedVersionError, type StampBookRepository } from './repository/stampBookRepository'
import type { CloudBookStore } from './sharing/cloudBookStore'
import { loadShareSettings } from './sharing/shareSettings'
import { CastleDetailPage, CastleNotFound } from './ui/CastleDetailPage'
import { CastleListPage } from './ui/CastleListPage'
import {
  LIST_FILTER,
  loadStampFilter,
  NEARBY_FILTER,
  saveStampFilter,
  type FilterPreference,
} from './ui/filterPreference'
import { MapPage } from './ui/MapPage'
import { NearbyPage } from './ui/NearbyPage'
import { TabBar } from './ui/TabBar'

type Props = {
  /** 共有していないときに使う端末内の記録帳 */
  localRepository: StampBookRepository
  /** 共有中に使うクラウドの記録帳（Firebase をつなぐまでは未設定で、端末内の記録帳を使う） */
  cloud?: CloudBookStore
  /** 絞り込みの選択や共有の設定など、端末ごとの設定を保存する先 */
  preferenceStorage: Storage
  /** 現在地を取得する窓口 */
  locationProvider: LocationProvider
  /** 現在時刻（テストで日付を固定するため差し替えられるようにしている） */
  now?: () => Date
}

type LoadState =
  { status: 'loading' } | { status: 'ready'; book: StampBook } | { status: 'error'; error: unknown }

function App({
  localRepository,
  cloud,
  preferenceStorage,
  locationProvider,
  now = () => new Date(),
}: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [filter, changeFilter] = useSavedFilter(preferenceStorage, LIST_FILTER)
  const [nearbyFilter, changeNearbyFilter] = useSavedFilter(preferenceStorage, NEARBY_FILTER)
  const [saveFailed, setSaveFailed] = useState(false)
  // 共有中ならクラウドの記録帳、そうでなければ端末内の記録帳を使う
  const [repository] = useState(() => {
    const settings = loadShareSettings(preferenceStorage)
    return settings && cloud ? cloud.open(settings.code) : localRepository
  })

  useEffect(() => {
    let cancelled = false
    repository.load().then(
      (book) => !cancelled && setState({ status: 'ready', book }),
      (error: unknown) => !cancelled && setState({ status: 'error', error }),
    )
    return () => {
      cancelled = true
    }
  }, [repository])

  // もう 1 人の変更（と自分の保存）を画面に反映する。読み込めていないときは触らない
  useEffect(
    () =>
      repository.subscribe((book) =>
        setState((s) => (s.status === 'ready' ? { status: 'ready', book } : s)),
      ),
    [repository],
  )

  const replaceRecord = (castleNumber: number, record: StampRecord) => {
    setState((s) =>
      s.status === 'ready' ? { status: 'ready', book: { ...s.book, [castleNumber]: record } } : s,
    )
  }

  /** 画面にはすぐ反映し、保存に失敗したら元に戻す（画面と保存内容を一致させるため） */
  const updateRecord = async (castleNumber: number, record: StampRecord) => {
    if (state.status !== 'ready') return
    const previous = getRecord(state.book, castleNumber)
    replaceRecord(castleNumber, record)
    setSaveFailed(false)
    try {
      await repository.saveRecord(castleNumber, record)
    } catch {
      replaceRecord(castleNumber, previous)
      setSaveFailed(true)
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">100名城スタンプ帳</h1>
      </header>
      {state.status === 'loading' && <p className="empty">読み込み中…</p>}
      {state.status === 'error' && <LoadError error={state.error} />}
      {saveFailed && (
        <p role="alert" className="alert">
          保存できませんでした。もう一度お試しください。
        </p>
      )}
      {state.status === 'ready' && (
        <Routes>
          <Route
            index
            element={
              <CastleListPage book={state.book} filter={filter} onFilterChange={changeFilter} />
            }
          />
          <Route
            path="nearby"
            element={
              <NearbyPage
                locationProvider={locationProvider}
                book={state.book}
                filter={nearbyFilter}
                onFilterChange={changeNearbyFilter}
              />
            }
          />
          <Route
            path="map"
            element={
              <MapPage
                book={state.book}
                locationProvider={locationProvider}
                preferenceStorage={preferenceStorage}
              />
            }
          />
          <Route
            path="castles/:number"
            element={
              <CastleDetailRoute
                book={state.book}
                today={() => toLocalIsoDate(now())}
                onChange={updateRecord}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      <TabBar />
    </main>
  )
}

/** 絞り込みの選択。変えるたびに保存し、次回も使う */
function useSavedFilter(storage: Storage, preference: FilterPreference) {
  const [filter, setFilter] = useState<StampFilter>(() => loadStampFilter(storage, preference))
  const changeFilter = (next: StampFilter) => {
    setFilter(next)
    saveStampFilter(storage, preference, next)
  }
  return [filter, changeFilter] as const
}

type CastleDetailRouteProps = {
  book: StampBook
  today: () => IsoDate
  onChange: (castleNumber: number, record: StampRecord) => void
}

function CastleDetailRoute({ book, today, onChange }: CastleDetailRouteProps) {
  const { number } = useParams()
  const castle = castles.find((c) => String(c.number) === number)
  if (!castle) return <CastleNotFound />
  return (
    <CastleDetailPage
      // 城が変わったらメモの下書きなどの状態を作り直す
      key={castle.number}
      castle={castle}
      record={getRecord(book, castle.number)}
      today={today}
      onChange={(record) => onChange(castle.number, record)}
    />
  )
}

function LoadError({ error }: { error: unknown }) {
  return (
    <p role="alert" className="alert">
      {error instanceof UnsupportedVersionError
        ? '保存データがこのアプリより新しい形式です。アプリを更新してください。'
        : '記録を読み込めませんでした。'}
    </p>
  )
}

export default App
