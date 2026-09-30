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
import { CastleLink } from './castleLinks'
import { FilterControl } from './FilterControl'
import { StampMark } from './StampMark'

type Props = {
  book: StampBook
  filter: StampFilter
  onFilterChange: (filter: StampFilter) => void
}

export function CastleListPage({ book, filter, onFilterChange }: Props) {
  const groups = filterGroups(groupByRegion(castles, book), book, filter)
  const overall = progressOf(castles, book)

  return (
    <div className="list-page">
      <div className="list-toolbar">
        <div className="overall-progress">
          <p className="overall-progress__text">
            <span className="overall-progress__label">押印済み</span>{' '}
            <ProgressText progress={overall} />
          </p>
          <div className="progress-bar" aria-hidden="true">
            <div
              className="progress-bar__fill"
              style={{ width: `${(overall.stamped / overall.total) * 100}%` }}
            />
          </div>
        </div>
        <FilterControl filter={filter} onFilterChange={onFilterChange} />
      </div>
      {groups.length === 0 && <p className="empty">該当する城はありません</p>}
      {groups.map((group) => (
        <RegionSection key={group.region} group={group} book={book} />
      ))}
    </div>
  )
}

function RegionSection({ group, book }: { group: RegionGroup; book: StampBook }) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="region">
      <h2 id={headingId} className="region__heading">
        <span className="region__name">{group.region}</span>
        <ProgressText progress={group.progress} className="region__progress" />
      </h2>
      <ul className="castle-list">
        {group.castles.map((castle) => (
          <li key={castle.number}>
            <CastleLink castleNumber={castle.number} className="castle-row">
              <span className="castle-row__number">{castle.number}</span>
              <span className="castle-row__name">{castle.name}</span>
              <span className="castle-row__prefecture">{castle.prefecture}</span>
              <span className="castle-row__mark">
                {isStamped(getRecord(book, castle.number)) && <StampMark />}
              </span>
            </CastleLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ProgressText({ progress, className }: { progress: Progress; className?: string }) {
  return (
    <span className={className}>
      {progress.stamped}/{progress.total}
    </span>
  )
}
