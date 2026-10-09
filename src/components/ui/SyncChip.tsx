import { motion } from 'framer-motion'
import { syncLabel } from '@/lib/syncStatus'
import { useSync } from '@/stores/sync'

const DOT: Record<string, string> = {
  synced: 'bg-success',
  syncing: 'bg-warning animate-pulse',
  offline: 'bg-danger',
}

/** Global sync indicator: Synced / Syncing / Offline with queued-write count. */
export function SyncChip() {
  const status = useSync((s) => s.status)
  const inFlight = useSync((s) => s.inFlight)
  return (
    <motion.div
      layout
      role="status"
      aria-live="polite"
      className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border bg-surface px-3 text-xs font-semibold"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${DOT[status]}`} aria-hidden="true" />
      {syncLabel(status, inFlight)}
    </motion.div>
  )
}
