import { useState } from 'react'
import { formatShareCode, type ShareCode } from '../domain/shareCode'
import type { JoinResult } from '../sharing/joinSharing'
import { BackLink } from './castleLinks'

type Props = {
  /** 共有中なら共有コード、共有していなければ null */
  shareCode: ShareCode | null
  /** 共有を始める（失敗したら例外） */
  onStartSharing: () => Promise<ShareCode>
  /** 共有に参加する（クラウドに問い合わせられなければ例外） */
  onJoinSharing: (input: string) => Promise<JoinResult>
}

/** 共有画面：共有していなければ始める・参加する、共有中なら共有コードを伝える */
export function SharePage({ shareCode, onStartSharing }: Props) {
  return (
    <section className="page share-page">
      <BackLink />
      <h2 className="page__title">共有</h2>
      {shareCode ? (
        <SharingView code={shareCode} />
      ) : (
        <StartSharingForm onStartSharing={onStartSharing} />
      )}
    </section>
  )
}

function StartSharingForm({ onStartSharing }: Pick<Props, 'onStartSharing'>) {
  const [starting, setStarting] = useState(false)
  const [failed, setFailed] = useState(false)

  const start = async () => {
    setStarting(true)
    setFailed(false)
    try {
      await onStartSharing()
    } catch {
      setFailed(true)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="card share-card">
      <h3 className="share-card__title">共有を始める</h3>
      <p className="share-card__text">
        今の記録をクラウドに上げて、もう 1
        人と同じ記録帳を使えるようにします。共有コードが作られるので、もう 1 人に伝えてください。
      </p>
      {failed && (
        <p role="alert" className="alert">
          共有を始められませんでした。電波の届く場所でもう一度お試しください。
        </p>
      )}
      <button type="button" className="button" onClick={start} disabled={starting}>
        {starting ? '準備しています…' : '共有を始める'}
      </button>
    </div>
  )
}

function SharingView({ code }: { code: ShareCode }) {
  const formatted = formatShareCode(code)
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator.share === 'function'

  const copy = async () => {
    await navigator.clipboard.writeText(formatted)
    setCopied(true)
  }

  const send = async () => {
    try {
      await navigator.share({ text: `100名城スタンプ帳の共有コード：${formatted}` })
    } catch {
      // 共有シートを閉じただけのときも例外になるので、何もしない
    }
  }

  return (
    <div className="card share-card">
      <h3 className="share-card__title">共有コード</h3>
      <p className="share-code">{formatted}</p>
      <div className="share-card__actions">
        <button type="button" className="button button--secondary" onClick={copy}>
          コピー
        </button>
        {canShare && (
          <button type="button" className="button button--secondary" onClick={send}>
            送る
          </button>
        )}
      </div>
      <p role="status" className="share-card__status">
        {copied ? 'コピーしました' : ''}
      </p>
      <p className="share-card__text">
        もう 1
        人は、ホーム画面に追加したアプリで「共有」→「共有に参加する」を開き、このコードを入力してください（Safari
        で開いた画面とホーム画面のアプリは記録の保存場所が別です）。
      </p>
    </div>
  )
}
