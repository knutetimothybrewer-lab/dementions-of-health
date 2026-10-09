import { EmptyState } from '@/components/ui/EmptyState'

export default function Library() {
  return (
    <div className="p-4">
      <h1 className="font-display mb-2 text-4xl">Library</h1>
      <EmptyState title="Exercise library" body="The exercise library is seeded in a later phase." />
    </div>
  )
}
