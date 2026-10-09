import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useOutlet } from 'react-router-dom'
import { useReduced } from '@/lib/useReduced'

/** Keeps the outlet element it was mounted with so exit animations don't show the next route. */
function Frozen({ children }: { children: ReactNode }) {
  const [frozen] = useState(children)
  return frozen
}

/** Slide + fade between routes (fade only with reduced motion). Transform/opacity only. */
export function PageTransition() {
  const location = useLocation()
  const outlet = useOutlet()
  const reduced = useReduced()
  const offset = reduced ? 0 : 24
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: offset }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -offset }}
        transition={{ duration: reduced ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <Frozen>{outlet}</Frozen>
      </motion.div>
    </AnimatePresence>
  )
}
