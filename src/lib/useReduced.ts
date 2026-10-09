import { useEffect, useState } from 'react'
import { resolveReducedMotion } from '@/lib/theme'
import { useUi } from '@/stores/ui'

/** True when animation should be swapped for fades/instant changes (OS preference or in-app toggle). */
export function useReduced(): boolean {
  const pref = useUi((s) => s.motion)
  const [system, setSystem] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setSystem(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return resolveReducedMotion(pref, system)
}
