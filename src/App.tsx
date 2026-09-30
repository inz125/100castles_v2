import { useEffect, useState } from 'react'
import type { StampBook, StampFilter } from './domain/stampBook'
import { UnsupportedVersionError, type StampBookRepository } from './repository/stampBookRepository'
import { CastleListPage } from './ui/CastleListPage'
import { loadStampFilter, saveStampFilter } from './ui/filterPreference'

type Props = {
  repository: StampBookRepository
  /** 絞り込みの選択など、表示の好みを保存する先 */
  preferenceStorage: Storage
}

type LoadState =
  { status: 'loading' } | { status: 'ready'; book: StampBook } | { status: 'error'; error: unknown }

function App({ repository, preferenceStorage }: Props) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [filter, setFilter] = useState<StampFilter>(() => loadStampFilter(preferenceStorage))

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

  return (
    <main>
      <h1>100名城スタンプ帳</h1>
      {state.status === 'loading' && <p>読み込み中…</p>}
      {state.status === 'error' && <LoadError error={state.error} />}
      {state.status === 'ready' && (
        <CastleListPage book={state.book} filter={filter} onFilterChange={changeFilter} />
      )}
    </main>
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
