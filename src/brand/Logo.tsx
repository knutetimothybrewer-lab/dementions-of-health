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

// Wing bars hug the kettlebell: [y, length]. Lengths taper outward-in for the winged silhouette.
const WING: ReadonlyArray<readonly [number, number]> = [
  [20, 96],
  [31, 76],
  [42, 56],
]
const BELL_GAP = 14 // distance from the bell's centre line to the inner end of each wing
const BAR_H = 7
const SLANT = 6 // italic lean, matching the wordmark

function Wing({ side, animated, reduced }: { side: 'left' | 'right'; animated: boolean; reduced: boolean }) {
  return (
    <g>
      {WING.map(([y, len], i) => {
        // Inner edge sits next to the bell; the wing extends outward from it.
        // The lean shifts each bar right by SLANT/2 at mid-height; subtract it so the gap centres on the bell.
        const centre = 200 - SLANT / 2
        const inner = side === 'left' ? centre - BELL_GAP - 8 : centre + BELL_GAP + 8
        const outer = side === 'left' ? inner - len : inner + len
        const [x1, x2] = outer < inner ? [outer, inner] : [inner, outer]
        const points = `${x1 + SLANT},${y} ${x2 + SLANT},${y} ${x2},${y + BAR_H} ${x1},${y + BAR_H}`
        return (
          <motion.polygon
            key={y}
            points={points}
            fill={i === 0 ? 'var(--stripe-a)' : 'var(--stripe-b)'}
            style={{ transformOrigin: side === 'left' ? 'right center' : 'left center', transformBox: 'fill-box' }}
            initial={animated ? (reduced ? { opacity: 0 } : { scaleX: 0, opacity: 0 }) : false}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        )
      })}
    </g>
  )
}

/** Smooth kettlebell: stroked handle arch + round body, centred on x=200. */
function Kettlebell() {
  return (
    <g fill="var(--stripe-a)">
      <path
        d="M191 26 V19 a9 9 0 0 1 18 0 V26"
        fill="none"
        stroke="var(--stripe-a)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="200" cy="38" r="15" />
      <rect x="190" y="49" width="20" height="4" rx="2" />
    </g>
  )
}

/** Inline SVG placeholder wordmark: "TOP TIER · Physical Therapy" with kettlebell and winged stripes. */
function PlaceholderMark({ height, animated, reduced }: { height: number; animated: boolean; reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 400 100"
      height={height}
      role="img"
      aria-label="Top Tier Physical Therapy"
      style={{ display: 'block', width: 'auto' }}
    >
      <Wing side="left" animated={animated} reduced={reduced} />
      <Wing side="right" animated={animated} reduced={reduced} />
      <Kettlebell />
      <motion.g
        initial={animated ? { opacity: 0, y: reduced ? 0 : 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 22 }}
      >
        <text
          x="200"
          y="84"
          textAnchor="middle"
          fontFamily="'Barlow Condensed','Arial Narrow',sans-serif"
          fontWeight={800}
          fontStyle="italic"
          fontSize="34"
          letterSpacing="2"
          fill="var(--stripe-a)"
        >
          TOP TIER
        </text>
        <text
          x="200"
          y="98"
          textAnchor="middle"
          fontFamily="'Barlow Condensed','Arial Narrow',sans-serif"
          fontWeight={700}
          fontStyle="italic"
          fontSize="11"
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
