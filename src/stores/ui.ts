import { create } from 'zustand'
import { readStorage, writeStorage } from '@/lib/safeStorage'
import type { MotionPref, ThemePref } from '@/lib/theme'

const THEME_KEY = 'tt-theme'
const MOTION_KEY = 'tt-motion'

function readTheme(): ThemePref {
  const v = readStorage(THEME_KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}
function readMotion(): MotionPref {
  const v = readStorage(MOTION_KEY)
  return v === 'reduce' || v === 'full' ? v : 'system'
}

interface UiState {
  theme: ThemePref
  motion: MotionPref
  setTheme: (t: ThemePref) => void
  setMotion: (m: MotionPref) => void
}

export const useUi = create<UiState>((set) => ({
  theme: readTheme(),
  motion: readMotion(),
  setTheme: (theme) => {
    writeStorage(THEME_KEY, theme)
    set({ theme })
  },
  setMotion: (motion) => {
    writeStorage(MOTION_KEY, motion)
    set({ motion })
  },
}))
