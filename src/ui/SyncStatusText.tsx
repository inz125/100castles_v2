import { SYNC_STATUS_LABELS, type SyncStatus } from '../sharing/syncStatus'

/** 同期の状態（変わったら読み上げる） */
export function SyncStatusText({ status, className }: { status: SyncStatus; className?: string }) {
  return (
    <span
      role="status"
      aria-label="同期の状態"
      className={`sync-status sync-status--${status} ${className ?? ''}`.trim()}
    >
      {SYNC_STATUS_LABELS[status]}
    </span>
  )
}
