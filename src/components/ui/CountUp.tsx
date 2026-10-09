import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'
import { useReduced } from '@/lib/useReduced'

interface Props {
  value: number
  decimals?: number
  duration?: number
  className?: string
}

/** Counts up to `value`. Writes straight to the DOM node so it never re-renders per frame. */
export function CountUp({ value, decimals = 0, duration = 0.9, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(0)
  const reduced = useReduced()
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    if (reduced) {
      node.textContent = fmt(value)
      from.current = value
      return
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (n) => {
        node.textContent = fmt(n)
        from.current = n
      },
    })
    return () => controls.stop()
  }, [value, decimals, duration, reduced])
  return (
    <span ref={ref} className={`num ${className ?? ''}`}>
      {value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}
