export type SyncStatus = 'synced' | 'syncing' | 'offline'

export interface SyncInputs {
  online: boolean
  /** Writes issued this session that the server has not yet acknowledged. */
  inFlight: number
  /** True until writes persisted by a previous session have been acknowledged. */
  restoring: boolean
}

export function deriveSyncStatus({ online, inFlight, restoring }: SyncInputs): SyncStatus {
  if (!online) return 'offline'
  if (inFlight > 0 || restoring) return 'syncing'
  return 'synced'
}

export function syncLabel(status: SyncStatus, queued: number): string {
  if (status === 'synced') return 'Synced'
  if (status === 'syncing') return queued > 0 ? `Syncing ${queued}` : 'Syncing'
  return queued > 0 ? `Offline · ${queued} queued` : 'Offline'
}
