import { create } from 'zustand'
import { deriveSyncStatus, type SyncStatus } from '@/lib/syncStatus'

interface SyncState {
  online: boolean
  inFlight: number
  restoring: boolean
  status: SyncStatus
  setOnline: (v: boolean) => void
  setRestoring: (v: boolean) => void
  begin: () => void
  end: () => void
}

const compute = (s: Pick<SyncState, 'online' | 'inFlight' | 'restoring'>) => deriveSyncStatus(s)

export const useSync = create<SyncState>((set) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  inFlight: 0,
  restoring: false,
  status: 'synced',
  setOnline: (online) => set((s) => ({ online, status: compute({ ...s, online }) })),
  setRestoring: (restoring) => set((s) => ({ restoring, status: compute({ ...s, restoring }) })),
  begin: () => set((s) => ({ inFlight: s.inFlight + 1, status: compute({ ...s, inFlight: s.inFlight + 1 }) })),
  end: () =>
    set((s) => {
      const inFlight = Math.max(0, s.inFlight - 1)
      return { inFlight, status: compute({ ...s, inFlight }) }
    }),
}))

/**
 * Wrap every Firestore write promise. Firestore resolves a write promise only
 * after the backend acknowledges it, so an unresolved tracked promise == a
 * queued write. Writes themselves are already applied to the local cache
 * (optimistic UI) before this resolves.
 */
export function trackWrite<T>(p: Promise<T>): Promise<T> {
  const { begin, end } = useSync.getState()
  begin()
  return p.finally(end)
}
