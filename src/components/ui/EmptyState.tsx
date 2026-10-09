import type { ReactNode } from 'react'
import { Stripes } from './Stripes'

interface Props {
  title: string
  body: string
  action?: ReactNode
}

export function EmptyState({ title, body, action }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <Stripes className="w-40" />
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="text-muted">{body}</p>
      {action}
    </div>
  )
}
