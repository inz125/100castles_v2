import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router'
import { castles } from './domain/castles'
import { toLocalIsoDate } from './domain/dates'
import { getRecord, type StampBook, type StampFilter } from './domain/stampBook'
import type { IsoDate, StampRecord } from './domain/stampRecord'
import { UnsupportedVersionError, type StampBookRepository } from './repository/stampBookRepository'
import { CastleDetailPage, CastleNotFound } from './ui/CastleDetailPage'
import { CastleListPage } from './ui/CastleListPage'
import { loadStampFilter, saveStampFilter } from './ui/filterPreference'

type Props = {
  repository: StampBookRepository
  /** 絞り込みの選択など、表示の好みを保存する先 */
  preferenceStorage: Storage
  /** 現在時刻（テストで日付を固定するため差し替えられるようにしている） */
  now?: () => Date
}

type LoadState =
  { status: 'loading' } | { status: 'ready'; book: StampBook } | { status: 'error'; error: unknown }

function App({ repository, preferenceStorage, now = () => new Date() }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [filter, setFilter] = useState<StampFilter>(() => loadStampFilter(preferenceStorage))
  const [saveFailed, setSaveFailed] = useState(false)

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

  const changeFilter = (next: StampFilter) => {
    setFilter(next)
    saveStampFilter(preferenceStorage, next)
  }

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
    <main>
      <h1>100名城スタンプ帳</h1>
      {state.status === 'loading' && <p>読み込み中…</p>}
      {state.status === 'error' && <LoadError error={state.error} />}
      {saveFailed && <p role="alert">保存できませんでした。もう一度お試しください。</p>}
      {state.status === 'ready' && (
        <Routes>
          <Route
            index
            element={
              <CastleListPage book={state.book} filter={filter} onFilterChange={changeFilter} />
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
    </main>
  )
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
      castle={castle}
      record={getRecord(book, castle.number)}
      today={today}
      onChange={(record) => onChange(castle.number, record)}
    />
  )
}

function LoadError({ error }: { error: unknown }) {
  return (
    <p role="alert">
      {error instanceof UnsupportedVersionError
        ? '保存データがこのアプリより新しい形式です。アプリを更新してください。'
        : '記録を読み込めませんでした。'}
    </p>
  )
}

export default App
