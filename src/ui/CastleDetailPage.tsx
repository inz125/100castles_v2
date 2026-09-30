import { useId } from 'react'
import { Link } from 'react-router'
import type { Castle } from '../domain/castles'
import { isStamped, setStamped, type IsoDate, type StampRecord } from '../domain/stampRecord'

type Props = {
  castle: Castle
  record: StampRecord
  /** 今日の日付（押印済みを ON にしたときに使う） */
  today: () => IsoDate
  onChange: (record: StampRecord) => void
}

export function CastleDetailPage({ castle, record, today, onChange }: Props) {
  const stampedId = useId()

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
        <p>
          押印日 <time dateTime={record.stampedOn}>{record.stampedOn}</time>
        </p>
      )}
    </article>
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
