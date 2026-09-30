import { useId } from 'react'
import { castles } from '../domain/castles'
import { isStamped } from '../domain/stampRecord'
import {
  getRecord,
  groupByRegion,
  progressOf,
  type Progress,
  type RegionGroup,
  type StampBook,
} from '../domain/stampBook'

type Props = {
  book: StampBook
}

export function CastleListPage({ book }: Props) {
  const groups = groupByRegion(castles, book)

  return (
    <div>
      <p>
        <span>押印済み</span> <ProgressText progress={progressOf(castles, book)} />
      </p>
      {groups.map((group) => (
        <RegionSection key={group.region} group={group} book={book} />
      ))}
    </div>
  )
}

function RegionSection({ group, book }: { group: RegionGroup; book: StampBook }) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>
        <span>{group.region}</span>
        <ProgressText progress={group.progress} />
      </h2>
      <ul>
        {group.castles.map((castle) => (
          <li key={castle.number}>
            <span>{castle.number}</span> <span>{castle.name}</span> <span>{castle.prefecture}</span>
            {isStamped(getRecord(book, castle.number)) && <StampMark />}
          </li>
        ))}
      </ul>
    </section>
  )
}

function StampMark() {
  return (
    <span role="img" aria-label="押印済み">
      印
    </span>
  )
}

function ProgressText({ progress }: { progress: Progress }) {
  return (
    <span>
      {progress.stamped}/{progress.total}
    </span>
  )
}
