/** 共有中の同期の状態 */
export type SyncStatus = 'synced' | 'pending' | 'offline'

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  synced: '同期済み',
  pending: '送信待ち',
  offline: 'オフライン',
}

/** 電波がなければオフライン（送信待ちはつながったときに送られる）、あれば送信待ちの有無で決める */
export function syncStatusOf({
  online,
  pendingWrites,
}: {
  online: boolean
  pendingWrites: boolean
}): SyncStatus {
  if (!online) return 'offline'
  return pendingWrites ? 'pending' : 'synced'
}
