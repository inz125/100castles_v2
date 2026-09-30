import { useId } from 'react'
import { castles } from '../domain/castles'
import { groupByRegion, type RegionGroup, type StampBook } from '../domain/stampBook'

type Props = {
  book: StampBook
}

export function CastleListPage({ book }: Props) {
  const groups = groupByRegion(castles, book)

  return (
    <div>
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
      <h2 id={headingId}>{group.region}</h2>
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
