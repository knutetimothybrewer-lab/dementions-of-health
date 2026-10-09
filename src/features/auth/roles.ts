export type Role = 'admin' | 'coach' | 'athlete'

export interface UserProfile {
  uid: string
  orgId: string
  role: Role
  displayName: string
  email: string
  /** Set only for role === 'athlete'. */
  linkedAthleteId?: string
  unit?: 'lb' | 'kg'
}

export const isCoachRole = (r: Role | undefined): boolean => r === 'admin' || r === 'coach'

/** Where each role lands after sign-in. */
export const homePathFor = (r: Role): string => (isCoachRole(r) ? '/today' : '/me')

export interface Invite {
  orgId: string
  role: Role
  linkedAthleteId?: string
}
