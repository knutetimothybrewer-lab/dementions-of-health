import { useEffect, type ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuth } from './authStore'
import { provisionProfile } from './profile'
import type { UserProfile } from './roles'

/** Subscribes to Firebase Auth and the user's profile doc; mirrors both into the auth store. */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let unsubProfile: (() => void) | undefined
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubProfile?.()
      unsubProfile = undefined
      const { set } = useAuth.getState()
      if (!user) {
        set({ status: 'signedOut', user: null, profile: null })
        return
      }
      set({ status: 'loading', user })
      provisionProfile(user)
        .then((res) => {
          if (res.kind === 'noAccess') {
            set({ status: 'noAccess', profile: null })
            return
          }
          set({ status: 'ready', profile: res.profile })
          // Live updates so role changes by an admin apply without re-login.
          unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
            if (snap.exists()) useAuth.getState().set({ profile: snap.data() as UserProfile })
          })
        })
        .catch(() => set({ status: 'error', profile: null }))
    })
    return () => {
      unsubAuth()
      unsubProfile?.()
    }
  }, [])
  return children
}
