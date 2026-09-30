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
import { StampMark } from './StampMark'

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
    <article className="detail">
      <BackToListLink />
      <header className="detail__header">
        <div>
          <p className="detail__meta">
            <span className="detail__number">{castle.number}</span>
            <span>{castle.prefecture}</span>
          </p>
          <h2 className="detail__name">{castle.name}</h2>
        </div>
        {isStamped(record) && <StampMark size="large" />}
      </header>

      <div className="card">
        <div className="field field--toggle">
          <label htmlFor={stampedId}>押印済み</label>
          <input
            id={stampedId}
            type="checkbox"
            className="toggle"
            checked={isStamped(record)}
            onChange={(e) => onChange(setStamped(record, e.target.checked, today()))}
          />
        </div>
        {record.stampedOn !== null && (
          <div className="field field--inline">
            <label htmlFor={stampedOnId}>押印日</label>
            <input
              id={stampedOnId}
              type="date"
              className="input"
              value={record.stampedOn}
              max={today()}
              onChange={(e) => onChange(setStampedDate(record, e.target.value, today()))}
            />
          </div>
        )}
      </div>

      <div className="card">
        <MemoField record={record} onChange={onChange} />
      </div>
    </article>
  )
}

/** 入力が止まってから保存するまでの時間 */
const MEMO_SAVE_DELAY_MS = 1000

/**
 * メモの入力欄。入力中は下書きとして持ち、次のときに保存する：
 * 入力が 1 秒止まったとき・入力欄から離れたとき・アプリが隠れたとき・画面を離れるとき。
 * 保存に失敗しても書いた文字は消さない（押印と違い、元に戻すと文章が失われるため）。
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
    // 記録と比べるので、保存に失敗して記録が元に戻ったときは次の機会に保存し直す
    if (draft === record.memo) return
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
    <div className="field">
      <label htmlFor={id}>メモ</label>
      <textarea
        id={id}
        className="input memo"
        rows={5}
        placeholder="見どころ、スタンプの場所、次に行くときのことなど"
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
    <div className="detail">
      <BackToListLink />
      <p className="empty">城が見つかりません</p>
    </div>
  )
}

function BackToListLink() {
  return (
    <Link to="/" className="back-link">
      一覧に戻る
    </Link>
  )
}
