import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Castle } from '../domain/castles'
import {
  isStamped,
  setMemo,
  setStamped,
  setStampedDate,
  type IsoDate,
  type StampRecord,
} from '../domain/stampRecord'

type Props = {
  castle: Castle
  record: StampRecord
  /** 今日の日付（押印済みを ON にしたときに使う） */
  today: () => IsoDate
  onChange: (record: StampRecord) => void
}

export function CastleDetailPage({ castle, record, today, onChange }: Props) {
  const stampedId = useId()
  const stampedOnId = useId()

  return (
    <article>
      <BackToListLink />
      <p>{castle.number}</p>
      <h2>{castle.name}</h2>
      <p>{castle.prefecture}</p>

      <div>
        <input
          id={stampedId}
          type="checkbox"
          checked={isStamped(record)}
          onChange={(e) => onChange(setStamped(record, e.target.checked, today()))}
        />
        <label htmlFor={stampedId}>押印済み</label>
      </div>
      {record.stampedOn !== null && (
        <div>
          <label htmlFor={stampedOnId}>押印日</label>
          <input
            id={stampedOnId}
            type="date"
            value={record.stampedOn}
            max={today()}
            onChange={(e) => onChange(setStampedDate(record, e.target.value, today()))}
          />
        </div>
      )}
      <MemoField record={record} onChange={onChange} />
    </article>
  )
}

/** 入力が止まってから保存するまでの時間 */
const MEMO_SAVE_DELAY_MS = 1000

/**
 * メモの入力欄。入力中は下書きとして持ち、次のときに保存する：
 * 入力が 1 秒止まったとき・入力欄から離れたとき・アプリが隠れたとき・画面を離れるとき。
 */
function MemoField({
  record,
  onChange,
}: {
  record: StampRecord
  onChange: (record: StampRecord) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState(record.memo)
  const savedMemo = useRef(record.memo)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // タイマーやイベントから呼ばれたときにも最新の値で保存するため、ref に持っておく
  const latest = useRef({ record, onChange, draft })
  useLayoutEffect(() => {
    latest.current = { record, onChange, draft }
  })

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
    const { record, onChange, draft } = latest.current
    if (draft === savedMemo.current) return
    savedMemo.current = draft
    onChange(setMemo(record, draft))
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      flush()
    }
  }, [flush])

  return (
    <div>
      <label htmlFor={id}>メモ</label>
      <textarea
        id={id}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          clearTimeout(timer.current)
          timer.current = setTimeout(flush, MEMO_SAVE_DELAY_MS)
        }}
        onBlur={flush}
      />
    </div>
  )
}

export function CastleNotFound() {
  return (
    <div>
      <BackToListLink />
      <p>城が見つかりません</p>
    </div>
  )
}

function BackToListLink() {
  return <Link to="/">一覧に戻る</Link>
}
