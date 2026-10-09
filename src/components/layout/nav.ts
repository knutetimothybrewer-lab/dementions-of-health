import type { IconName } from '@/components/ui/Icon'

export interface NavItem {
  to: string
  label: string
  icon: IconName
}

export const COACH_NAV: readonly NavItem[] = [
  { to: '/today', label: 'Today', icon: 'today' },
  { to: '/athletes', label: 'Athletes', icon: 'athletes' },
  { to: '/programs', label: 'Programs', icon: 'programs' },
  { to: '/library', label: 'Library', icon: 'library' },
  { to: '/more', label: 'More', icon: 'more' },
]

export const ATHLETE_NAV: readonly NavItem[] = [
  { to: '/me', label: 'Today', icon: 'today' },
  { to: '/me/progress', label: 'Progress', icon: 'programs' },
  { to: '/me/more', label: 'More', icon: 'more' },
]
