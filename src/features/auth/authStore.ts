import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { UserProfile } from './roles'

export type AuthStatus =
  /** Waiting for Firebase Auth to restore (or deny) a session. */
  | 'loading'
  | 'signedOut'
  /** Signed in, but no profile, invite or bootstrap path: a coach must invite this email. */
  | 'noAccess'
  /** Signed in and profile lookup failed (e.g. offline on first ever load). */
  | 'error'
  | 'ready'

interface AuthState {
  status: AuthStatus
  user: User | null
  profile: UserProfile | null
  set: (s: Partial<Omit<AuthState, 'set'>>) => void
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  profile: null,
  set: (s) => set(s),
}))
