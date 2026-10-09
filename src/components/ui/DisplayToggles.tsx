import { cycleTheme } from '@/lib/theme'
import { useUi } from '@/stores/ui'

const THEME_LABEL = { system: 'System', light: 'Light', dark: 'Dark' } as const

/** Theme (system -> light -> dark) and Reduce-motion controls. Applies theme to <html>. */
export function ThemeToggle() {
  const theme = useUi((s) => s.theme)
  const setTheme = useUi((s) => s.setTheme)
  return (
    <button
      type="button"
      onClick={() => setTheme(cycleTheme(theme))}
      className="min-h-12 min-w-12 cursor-pointer rounded-xl border border-border px-4 text-sm font-semibold"
      aria-label={`Theme: ${THEME_LABEL[theme]}. Tap to change.`}
    >
      Theme: {THEME_LABEL[theme]}
    </button>
  )
}

export function MotionToggle() {
  const motion = useUi((s) => s.motion)
  const setMotion = useUi((s) => s.setMotion)
  const reduced = motion === 'reduce'
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 text-sm font-semibold">
      <input
        type="checkbox"
        className="h-5 w-5 accent-[var(--primary)]"
        checked={reduced}
        onChange={(e) => setMotion(e.target.checked ? 'reduce' : 'system')}
      />
      Reduce motion
    </label>
  )
}
