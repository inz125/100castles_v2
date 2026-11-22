import { useEffect, useId, useRef, useState } from 'react'
import { michinoeki, type Michinoeki } from '../domain/michinoeki'
import {
  completedPrefectureCount,
  filterPrefectureGroups,
  groupByPrefecture,
  visitProgressOf,
  type MichinoekiPrefecture,
  type PrefectureGroup,
  type VisitBook,
  type VisitFilter,
} from '../domain/michinoekiVisits'
import { isCompleted, percentOf, type Progress } from '../domain/stampBook'
import type { IsoDate } from '../domain/stampRecord'
import { FilterControl, type FilterOption } from './FilterControl'
import { scrollBehavior } from './motion'
import { ProgressRing } from './ProgressRing'
import { StationPinIcon } from './StationPinIcon'

const VISIT_FILTER_OPTIONS: readonly FilterOption<VisitFilter>[] = [
  { value: 'all', label: 'すべて' },
  { value: 'unvisited', label: '未訪問' },
  { value: 'visited', label: '訪問済み' },
]

type Props = {
  visits: VisitBook
  filter: VisitFilter
  onFilterChange: (filter: VisitFilter) => void
  /** 駅に行った／行っていないを切り替える */
  onVisitChange: (stationId: number, visited: boolean) => void
}

/** 道の駅の制覇ページ：全体と県ごとの制覇率のダッシュボードと、行ったかどうかの記録 */
export function MichinoekiPage({ visits, filter, onFilterChange, onVisitChange }: Props) {
  const allGroups = groupByPrefecture(visits)
  const groups = filterPrefectureGroups(allGroups, visits, filter)
  const overall = visitProgressOf(michinoeki, visits)
  const sections = useRef(new Map<MichinoekiPrefecture, HTMLElement>())
  // スクロールしたい県。絞り込みで隠れていれば、表示されるのを待ってからスクロールする
  const [scrollTarget, setScrollTarget] = useState<MichinoekiPrefecture | null>(null)

  useEffect(() => {
    if (scrollTarget === null) return
    const section = sections.current.get(scrollTarget)
    if (!section) return
    section.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
    setScrollTarget(null)
  }, [scrollTarget, filter])

  const showPrefecture = (prefecture: MichinoekiPrefecture) => {
    if (!groups.some((g) => g.prefecture === prefecture)) onFilterChange('all')
    setScrollTarget(prefecture)
  }

  return (
    <div className="page station-page">
      <section className="station-hero" aria-labelledby="station-hero-title">
        <h2 id="station-hero-title" className="page__title station-hero__title">
          道の駅
        </h2>
        <p className="station-hero__lead">中部「道の駅」スタンプブックの駅</p>
        <div className="station-hero__main">
          <ProgressRing label="全体" progress={overall} className="station-hero__ring">
            <span className="station-hero__count">
              <span className="station-hero__visited">{overall.stamped}</span>
              <span className="station-hero__total"> / {overall.total}</span>
            </span>
            <span className="station-hero__percent">{percentOf(overall)}%</span>
          </ProgressRing>
          <dl className="station-stats">
            <div className="station-stats__item">
              <dt>制覇率</dt>
              <dd>
                {percentOf(overall)}
                <small>%</small>
              </dd>
            </div>
            <div className="station-stats__item">
              <dt>制覇した県</dt>
              <dd>
                {completedPrefectureCount(allGroups)}
                <small> / {allGroups.length}</small>
              </dd>
            </div>
            <div className="station-stats__item">
              <dt>残り</dt>
              <dd>
                {overall.total - overall.stamped}
                <small> 駅</small>
              </dd>
            </div>
          </dl>
        </div>
        <PrefectureBoard groups={allGroups} onSelect={showPrefecture} />
      </section>
      <div className="list-toolbar">
        <FilterControl
          filter={filter}
          onFilterChange={onFilterChange}
          options={VISIT_FILTER_OPTIONS}
        />
      </div>
      {groups.length === 0 && <p className="empty">該当する道の駅はありません</p>}
      {groups.map((group) => (
        <PrefectureSection
          key={group.prefecture}
          group={group}
          visits={visits}
          onVisitChange={onVisitChange}
          sectionRef={(el) => {
            if (el) sections.current.set(group.prefecture, el)
            else sections.current.delete(group.prefecture)
          }}
        />
      ))}
    </div>
  )
}

/** 県ごとの制覇率（棒グラフ）。タップでその県の見出しへ */
function PrefectureBoard({
  groups,
  onSelect,
}: {
  groups: readonly PrefectureGroup[]
  onSelect: (prefecture: MichinoekiPrefecture) => void
}) {
  return (
    <ul className="prefecture-board" aria-label="県ごとの進捗">
      {groups.map(({ prefecture, progress }) => (
        <li key={prefecture}>
          <button
            type="button"
            className={['prefecture-bar', isCompleted(progress) && 'prefecture-bar--completed']
              .filter(Boolean)
              .join(' ')}
            aria-label={progressLabel(prefecture, progress)}
            onClick={() => onSelect(prefecture)}
          >
            <span className="prefecture-bar__name" aria-hidden="true">
              {prefecture}
              {isCompleted(progress) && <span className="seal seal--inline">制覇</span>}
            </span>
            <span className="prefecture-bar__numbers" aria-hidden="true">
              <span className="prefecture-bar__percent">{percentOf(progress)}%</span>
              <span className="prefecture-bar__count">
                {progress.stamped}/{progress.total}
              </span>
            </span>
            <span className="prefecture-bar__track" aria-hidden="true">
              <span className="prefecture-bar__fill" style={{ width: `${ratioOf(progress)}%` }} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function PrefectureSection({
  group,
  visits,
  onVisitChange,
  sectionRef,
}: {
  group: PrefectureGroup
  visits: VisitBook
  onVisitChange: (stationId: number, visited: boolean) => void
  sectionRef: (el: HTMLElement | null) => void
}) {
  const headingId = useId()

  return (
    <section ref={sectionRef} aria-labelledby={headingId} className="region">
      <h2 id={headingId} className="region__heading">
        <span className="region__name">
          {group.prefecture}
          {isCompleted(group.progress) && <span className="seal seal--inline">制覇</span>}
        </span>
        <span className="region__progress">
          {group.progress.stamped}/{group.progress.total}（{percentOf(group.progress)}%）
        </span>
      </h2>
      <ul className="castle-list">
        {group.stations.map((station) => (
          <li key={station.id}>
            <StationRow
              station={station}
              visitedOn={visits[station.id]}
              onChange={(visited) => onVisitChange(station.id, visited)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function StationRow({
  station,
  visitedOn,
  onChange,
}: {
  station: Michinoeki
  visitedOn: IsoDate | undefined
  onChange: (visited: boolean) => void
}) {
  const visited = visitedOn !== undefined
  return (
    <label className={['station-row', visited && 'station-row--visited'].filter(Boolean).join(' ')}>
      <StationPinIcon className="station-row__icon" />
      <span className="station-row__body">
        <span className="station-row__name">{station.name}</span>
        {visited && <span className="station-row__date">{formatVisitDate(visitedOn)} 訪問</span>}
      </span>
      <input
        type="checkbox"
        className="station-row__check"
        aria-label={`道の駅 ${station.name}`}
        checked={visited}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

function ratioOf({ stamped, total }: Progress): number {
  return total === 0 ? 0 : (stamped / total) * 100
}

function progressLabel(name: string, progress: Progress): string {
  return `${name} ${progress.stamped}/${progress.total}（${percentOf(progress)}%）${isCompleted(progress) ? '制覇' : ''}`
}

/** 2026-10-01 → 2026/10/01 */
function formatVisitDate(date: IsoDate): string {
  return date.replaceAll('-', '/')
}
