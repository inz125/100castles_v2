import { useId } from 'react'

type Props = {
  onUpdate: () => void
  onLater: () => void
}

/** 新しい版があることを知らせる、iPhone の確認ダイアログ風のポップアップ（D-08） */
export function UpdatePrompt({ onUpdate, onLater }: Props) {
  const titleId = useId()
  return (
    <div className="update-prompt">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="update-prompt__dialog"
      >
        <p id={titleId} className="update-prompt__title">
          新しいバージョンがあります
        </p>
        <p className="update-prompt__message">更新すると、新しい版で開き直します。</p>
        <div className="update-prompt__actions">
          <button type="button" className="update-prompt__button" onClick={onLater}>
            あとで
          </button>
          <button
            type="button"
            className="update-prompt__button update-prompt__button--primary"
            onClick={onUpdate}
          >
            更新
          </button>
        </div>
      </div>
    </div>
  )
}
