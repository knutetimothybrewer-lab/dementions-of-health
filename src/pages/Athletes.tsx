import { EmptyState } from '@/components/ui/EmptyState'

export default function Athletes() {
  return (
    <div className="p-4">
      <h1 className="font-display mb-2 text-4xl">Athletes</h1>
      <EmptyState title="Your roster is empty" body="Athletes you add will show their block, compliance and latest PR here." />
    </div>
  )
}
