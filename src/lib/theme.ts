export type ThemePref = 'system' | 'light' | 'dark'
export type MotionPref = 'system' | 'reduce' | 'full'

export function resolveTheme(pref: ThemePref, systemDark: boolean): 'light' | 'dark' {
  if (pref === 'system') return systemDark ? 'dark' : 'light'
  return pref
}

export function resolveReducedMotion(pref: MotionPref, systemReduces: boolean): boolean {
  if (pref === 'system') return systemReduces
  return pref === 'reduce'
}

export function cycleTheme(pref: ThemePref): ThemePref {
  return pref === 'system' ? 'light' : pref === 'light' ? 'dark' : 'system'
}
