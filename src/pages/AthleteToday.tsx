import { EmptyState } from '@/components/ui/EmptyState'

export default function AthleteToday() {
  return (
    <div className="p-4">
      <h1 className="font-display mb-2 text-4xl">Today</h1>
      <EmptyState title="Nothing scheduled" body="When your coach assigns a session, it shows up here." />
    </div>
  )
}
