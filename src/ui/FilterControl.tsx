import type { StampFilter } from '../domain/stampBook'

const FILTER_OPTIONS: readonly { value: StampFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'unstamped', label: '未押印' },
  { value: 'stamped', label: '押印済み' },
]

type Props = {
  filter: StampFilter
  onFilterChange: (filter: StampFilter) => void
}

/** 絞り込みの切り替え（すべて / 未押印 / 押印済み） */
export function FilterControl({ filter, onFilterChange }: Props) {
  return (
    <div role="group" aria-label="絞り込み" className="segmented">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="segmented__button"
          aria-pressed={option.value === filter}
          onClick={() => onFilterChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
