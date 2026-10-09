import { motion, type HTMLMotionProps } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg',
  secondary: 'bg-secondary text-secondary-fg',
  ghost: 'bg-transparent text-fg border border-border',
  accent: 'bg-accent text-accent-fg',
  danger: 'bg-danger text-white',
}

interface Props extends HTMLMotionProps<'button'> {
  variant?: Variant
}

/** Spring-press button. 48px minimum touch target. */
export function Button({ variant = 'primary', className, type = 'button', ...rest }: Props) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={`inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className ?? ''}`}
      {...rest}
    />
  )
}
