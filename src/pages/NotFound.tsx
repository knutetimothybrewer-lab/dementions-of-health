import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      body="That page doesn't exist."
      action={
        <Link to="/" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-5 font-semibold text-primary-fg">
          Go home
        </Link>
      }
    />
  )
}
