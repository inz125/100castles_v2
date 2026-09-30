import { BackLink } from './castleLinks'

/** 共有画面（中身は 14-2 以降で作る） */
export function SharePage() {
  return (
    <section className="page share-page">
      <BackLink />
      <h2 className="page__title">共有</h2>
    </section>
  )
}
