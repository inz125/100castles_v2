import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
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
export function SharePage({ shareCode, onStartSharing, onJoinSharing }: Props) {
  return (
    <section className="page share-page">
      <BackLink />
      <h2 className="page__title">共有</h2>
      {shareCode ? (
        <SharingView code={shareCode} />
      ) : (
        <>
          <StartSharingForm onStartSharing={onStartSharing} />
          <JoinSharingForm onJoinSharing={onJoinSharing} />
        </>
      )}
    </section>
  )
}

const JOIN_ERROR_MESSAGES = {
  invalid: '共有コードは 12 文字です（例：ABCD-2345-EFGH）。入力を確かめてください。',
  'not-found': '共有コードが見つかりません。入力を確かめてください。',
  failed: '参加できませんでした。電波の届く場所でもう一度お試しください。',
} as const

function JoinSharingForm({ onJoinSharing }: Pick<Props, 'onJoinSharing'>) {
  const navigate = useNavigate()
  const inputId = useId()
  const [input, setInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<keyof typeof JOIN_ERROR_MESSAGES | null>(null)

  const join = async (event: FormEvent) => {
    event.preventDefault()
    setJoining(true)
    setError(null)
    try {
      const result = await onJoinSharing(input)
      if (result.status === 'joined') {
        navigate('/')
        return
      }
      setError(result.status)
    } catch {
      setError('failed')
    }
    setJoining(false)
  }

  return (
    <form className="card share-card" onSubmit={join}>
      <h3 className="share-card__title">共有に参加する</h3>
      <p className="share-card__text">
        もう 1
        人から聞いた共有コードを入力してください。ホーム画面に追加したアプリで参加してください（Safari
        で開いた画面とは記録の保存場所が別です）。
      </p>
      <label htmlFor={inputId} className="visually-hidden">
        共有コード
      </label>
      <input
        id={inputId}
        className="input share-code-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="ABCD-2345-EFGH"
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
      />
      {error && (
        <p role="alert" className="alert">
          {JOIN_ERROR_MESSAGES[error]}
        </p>
      )}
      <button type="submit" className="button" disabled={joining || input.trim() === ''}>
        {joining ? '確かめています…' : '参加する'}
      </button>
    </form>
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
