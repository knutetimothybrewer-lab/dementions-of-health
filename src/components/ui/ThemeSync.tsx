import { useEffect } from 'react'
import { resolveTheme } from '@/lib/theme'
import { useUi } from '@/stores/ui'

/** Applies theme + motion preferences to <html> and tracks OS changes. Renders nothing. */
export function ThemeSync() {
  const theme = useUi((s) => s.theme)
  const motion = useUi((s) => s.motion)
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = resolveTheme(theme, mq.matches)
      document.documentElement.dataset.theme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0B1730' : '#1F3A63')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => {
    if (motion === 'reduce') document.documentElement.dataset.motion = 'reduce'
    else delete document.documentElement.dataset.motion
  }, [motion])
  return null
}
