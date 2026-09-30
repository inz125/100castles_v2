import { useId } from 'react'
import { castles } from '../domain/castles'
import { isStamped } from '../domain/stampRecord'
import {
  filterGroups,
  getRecord,
  groupByRegion,
  progressOf,
  type Progress,
  type RegionGroup,
  type StampBook,
  type StampFilter,
} from '../domain/stampBook'

type Props = {
  book: StampBook
  filter: StampFilter
  onFilterChange: (filter: StampFilter) => void
}

const FILTER_OPTIONS: readonly { value: StampFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'unstamped', label: '未押印' },
  { value: 'stamped', label: '押印済み' },
]

export function CastleListPage({ book, filter, onFilterChange }: Props) {
  const groups = filterGroups(groupByRegion(castles, book), book, filter)

  return (
    <div>
      <p>
        <span>押印済み</span> <ProgressText progress={progressOf(castles, book)} />
      </p>
      <div role="group" aria-label="絞り込み">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === filter}
            onClick={() => onFilterChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {groups.length === 0 && <p>該当する城はありません</p>}
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
