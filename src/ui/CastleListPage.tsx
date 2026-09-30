import { useId } from 'react'
import { castles } from '../domain/castles'
import {
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
        <RegionSection key={group.region} group={group} />
      ))}
    </div>
  )
}

function RegionSection({ group }: { group: RegionGroup }) {
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
          </li>
        ))}
      </ul>
    </section>
  )
}

function ProgressText({ progress }: { progress: Progress }) {
  return (
    <span>
      {progress.stamped}/{progress.total}
    </span>
  )
}
