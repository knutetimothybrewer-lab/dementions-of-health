import { EmptyState } from '@/components/ui/EmptyState'

export default function Programs() {
  return (
    <div className="p-4">
      <h1 className="font-display mb-2 text-4xl">Programs</h1>
      <EmptyState title="No programs yet" body="Build a block of weeks and sessions, then assign it to an athlete or group." />
    </div>
  )
}
