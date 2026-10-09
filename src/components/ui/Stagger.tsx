import { motion, type HTMLMotionProps } from 'framer-motion'
import { useReduced } from '@/lib/useReduced'

/** List container: children using <StaggerItem> enter one after another. */
export function Stagger({ children, ...rest }: HTMLMotionProps<'div'>) {
  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} {...rest}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, ...rest }: HTMLMotionProps<'div'>) {
  const reduced = useReduced()
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : 14 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
