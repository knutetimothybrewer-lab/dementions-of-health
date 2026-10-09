import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReduced } from '@/lib/useReduced'

interface Props {
  /** 0..1 */
  progress: number
  size?: number
  stroke?: number
  /** Ring colour token, e.g. 'var(--accent)'. */
  color?: string
  label: string
  children?: ReactNode
}

/** Circular progress ring (week/block/session completion, rest timer). Exposed as a progressbar. */
export function ProgressRing({ progress, size = 64, stroke = 7, color = 'var(--primary-text)', label, children }: Props) {
  const reduced = useReduced()
  const p = Math.min(1, Math.max(0, progress))
  const r = (size - stroke) / 2
  return (
    <div
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: reduced ? p : 0 }}
          animate={{ pathLength: p }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 80, damping: 18 }}
        />
      </svg>
      {children ? <div className="absolute inset-0 grid place-items-center">{children}</div> : null}
    </div>
  )
}
