const PATHS = {
  today: 'M4 5h16v14H4zM4 9h16M8 3v4M16 3v4',
  athletes: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 19c0-3 3-5 6-5s6 2 6 5M17 8a2.5 2.5 0 110 5M18 14c2 .5 3 2 3 4',
  programs: 'M5 4h14v16H5zM9 8h6M9 12h6M9 16h4',
  library: 'M3 9h3v6H3zM18 9h3v6h-3zM6 12h12M8 7v10M16 7v10',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  me: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 4-6 8-6s8 2 8 6',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
