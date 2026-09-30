import { Link } from 'react-router'
import type { Castle } from '../domain/castles'

type Props = {
  castle: Castle
}

export function CastleDetailPage({ castle }: Props) {
  return (
    <article>
      <BackToListLink />
      <p>{castle.number}</p>
      <h2>{castle.name}</h2>
      <p>{castle.prefecture}</p>
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
