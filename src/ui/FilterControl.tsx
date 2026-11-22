import type { StampFilter } from '../domain/stampBook'

export type FilterOption<T extends string> = { value: T; label: string }

const STAMP_FILTER_OPTIONS: readonly FilterOption<StampFilter>[] = [
  { value: 'all', label: 'すべて' },
  { value: 'unstamped', label: '未押印' },
  { value: 'stamped', label: '押印済み' },
]

type Props<T extends string> = {
  filter: T
  onFilterChange: (filter: T) => void
  /** 選択肢（省略すると城の すべて / 未押印 / 押印済み） */
  options?: readonly FilterOption<T>[]
}

/** 絞り込みの切り替え（すべて / 未押印 / 押印済み など） */
export function FilterControl<T extends string = StampFilter>({
  filter,
  onFilterChange,
  options = STAMP_FILTER_OPTIONS as unknown as readonly FilterOption<T>[],
}: Props<T>) {
  return (
    <div role="group" aria-label="絞り込み" className="segmented">
      {options.map((option) => (
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
