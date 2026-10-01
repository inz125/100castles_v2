import { useEffect, useId, useRef, useState } from 'react'
import { castles, type Region } from '../domain/castles'
import { isStamped } from '../domain/stampRecord'
import {
  filterGroups,
  getRecord,
  groupByRegion,
  isCompleted,
  percentOf,
  progressOf,
  type Progress,
  type RegionGroup,
  type StampBook,
  type StampFilter,
} from '../domain/stampBook'
import { CastleLink } from './castleLinks'
import { CastleSilhouette } from './CastleSilhouette'
import { FilterControl } from './FilterControl'
import { ProgressRing } from './ProgressRing'
import { StampMark } from './StampMark'

type Props = {
  book: StampBook
  filter: StampFilter
  onFilterChange: (filter: StampFilter) => void
}

export function CastleListPage({ book, filter, onFilterChange }: Props) {
  const allGroups = groupByRegion(castles, book)
  const groups = filterGroups(allGroups, book, filter)
  const sections = useRef(new Map<Region, HTMLElement>())
  // スクロールしたい地方。絞り込みで隠れていれば、表示されるのを待ってからスクロールする
  const [scrollTarget, setScrollTarget] = useState<Region | null>(null)

  useEffect(() => {
    if (scrollTarget === null) return
    const section = sections.current.get(scrollTarget)
    if (!section) return
    section.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    setScrollTarget(null)
  }, [scrollTarget, filter])

  const showRegion = (region: Region) => {
    if (!groups.some((g) => g.region === region)) onFilterChange('all')
    setScrollTarget(region)
  }
  const overall = progressOf(castles, book)

  return (
    <div className="list-page">
      <section className="progress-hero" aria-label="進捗">
        <div className="progress-hero__main">
          <CastleSilhouette className="progress-hero__castle" />
          <ProgressRing label="全体" progress={overall} className="progress-hero__ring">
            <span className="progress-hero__count">
              <span className="progress-hero__stamped">{overall.stamped}</span>
              <span className="progress-hero__total"> / {overall.total}</span>
            </span>
            <span className="progress-hero__percent">{percentOf(overall)}%</span>
          </ProgressRing>
        </div>
        <RegionRings groups={allGroups} onSelect={showRegion} />
      </section>
      <div className="list-toolbar">
        <FilterControl filter={filter} onFilterChange={onFilterChange} />
      </div>
      {groups.length === 0 && <p className="empty">該当する城はありません</p>}
      {groups.map((group) => (
        <RegionSection
          key={group.region}
          group={group}
          book={book}
          sectionRef={(el) => {
            if (el) sections.current.set(group.region, el)
            else sections.current.delete(group.region)
          }}
        />
      ))}
    </div>
  )
}

/** 地方ごとの小さな進捗リング（横にスクロールする） */
function RegionRings({
  groups,
  onSelect,
}: {
  groups: readonly RegionGroup[]
  onSelect: (region: Region) => void
}) {
  return (
    <ul className="region-rings" aria-label="地方ごとの進捗">
      {groups.map(({ region, progress }) => (
        <li key={region}>
          <button type="button" className="region-ring" onClick={() => onSelect(region)}>
            <ProgressRing label={region} progress={progress} className="region-ring__ring">
              {isCompleted(progress) ? (
                <span className="seal seal--small">制覇</span>
              ) : (
                <span className="region-ring__count">
                  {progress.stamped}/{progress.total}
                </span>
              )}
            </ProgressRing>
            <span className="region-ring__name" aria-hidden="true">
              {region}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function RegionSection({
  group,
  book,
  sectionRef,
}: {
  group: RegionGroup
  book: StampBook
  sectionRef: (el: HTMLElement | null) => void
}) {
  const headingId = useId()

  return (
    <section ref={sectionRef} aria-labelledby={headingId} className="region">
      <h2 id={headingId} className="region__heading">
        <span className="region__name">
          {group.region}
          {isCompleted(group.progress) && <span className="seal seal--inline">制覇</span>}
        </span>
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

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}
