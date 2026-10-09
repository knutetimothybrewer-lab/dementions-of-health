import { motion } from 'framer-motion'
import { useReduced } from '@/lib/useReduced'

interface Props {
  /** Number of bands (1-4). */
  bands?: number
  className?: string
  /** Sweep in from the left on mount. */
  animated?: boolean
}

/** Winged-stripe divider: bands taper in length, echoing the logo. */
export function Stripes({ bands = 3, className, animated = true }: Props) {
  const reduced = useReduced()
  return (
    <div className={`stripes ${className ?? ''}`} aria-hidden="true">
      {Array.from({ length: bands }, (_, i) => (
        <motion.i
          key={i}
          style={{ width: `${100 - i * 14}%`, transformOrigin: 'left center' }}
          initial={animated ? (reduced ? { opacity: 0 } : { scaleX: 0 }) : false}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  )
}
