import { motion } from 'framer-motion'
import { useReduced } from '@/lib/useReduced'
import { LOGO_URL } from './logoSource'

interface Props {
  /** Height in px of the whole mark. */
  height?: number
  /** Play the stripes-sweep-in entrance (splash / login). */
  animated?: boolean
  className?: string
}

// Wing bars: [y, length]. Lengths taper to give the "winged stripe" silhouette.
const WING: ReadonlyArray<readonly [number, number]> = [
  [14, 70],
  [24, 56],
  [34, 42],
]

function Wing({ side, animated, reduced }: { side: 'left' | 'right'; animated: boolean; reduced: boolean }) {
  return (
    <g>
      {WING.map(([y, len], i) => {
        const x = side === 'left' ? 118 - len : 282
        return (
          <motion.rect
            key={y}
            x={x}
            y={y}
            width={len}
            height={6}
            fill={i === 0 ? 'var(--stripe-a)' : 'var(--stripe-b)'}
            style={{
              skewX: -18,
              transformOrigin: side === 'left' ? 'right center' : 'left center',
              transformBox: 'fill-box',
            }}
            initial={animated ? (reduced ? { opacity: 0 } : { scaleX: 0, opacity: 0 }) : false}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        )
      })}
    </g>
  )
}

/** Inline SVG placeholder wordmark: "TOP TIER · Physical Therapy" with kettlebell and winged stripes. */
function PlaceholderMark({ height, animated, reduced }: { height: number; animated: boolean; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 400 96"
      height={height}
      role="img"
      aria-label="Top Tier Physical Therapy"
      style={{ display: 'block', width: 'auto' }}
    >
      <Wing side="left" animated={animated} reduced={reduced} />
      <Wing side="right" animated={animated} reduced={reduced} />
      {/* Kettlebell */}
      <g fill="var(--stripe-a)" transform="translate(0 -5)">
        <path d="M184 30c0-9 7-15 16-15s16 6 16 15v3h-6v-3c0-5-4-9-10-9s-10 4-10 9v3h-6z" />
        <circle cx="200" cy="40" r="13" />
      </g>
      <motion.g
        initial={animated ? { opacity: 0, y: reduced ? 0 : 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 22 }}
      >
        <text
          x="200"
          y="78"
          textAnchor="middle"
          fontFamily="'Barlow Condensed','Arial Narrow',sans-serif"
          fontWeight={800}
          fontStyle="italic"
          fontSize="40"
          letterSpacing="2"
          fill="var(--stripe-a)"
        >
          TOP TIER
        </text>
        <text
          x="200"
          y="94"
          textAnchor="middle"
          fontFamily="'Barlow Condensed','Arial Narrow',sans-serif"
          fontWeight={700}
          fontStyle="italic"
          fontSize="12"
          letterSpacing="4"
          fill="var(--text-muted)"
        >
          PHYSICAL THERAPY
        </text>
      </motion.g>
    </svg>
  )
}

export function Logo({ height = 40, animated = false, className }: Props) {
  const reduced = useReduced()
  if (LOGO_URL) {
    // A raster logo has a white background; keep it on a white chip so dark mode stays legible.
    return (
      <span className={`inline-flex rounded-lg bg-white p-1 ${className ?? ''}`}>
        <motion.img
          src={LOGO_URL}
          alt="Top Tier Physical Therapy"
          height={height}
          style={{ height, width: 'auto' }}
          initial={animated ? { opacity: 0, scale: reduced ? 1 : 0.94 } : false}
          animate={{ opacity: 1, scale: 1 }}
        />
      </span>
    )
  }
  return (
    <span className={className}>
      <PlaceholderMark height={height} animated={animated} reduced={reduced} />
    </span>
  )
}
