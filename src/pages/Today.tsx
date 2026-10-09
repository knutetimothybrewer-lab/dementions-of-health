import { EmptyState } from '@/components/ui/EmptyState'

export default function Today() {
  return (
    <div className="p-4">
      <h1 className="font-display mb-2 text-4xl">Today</h1>
      <EmptyState title="No sessions yet" body="Assigned sessions for today will appear here once athletes and programs are set up." />
    </div>
  )
}
