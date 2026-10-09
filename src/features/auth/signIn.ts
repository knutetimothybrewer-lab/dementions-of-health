import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { readStorage, writeStorage } from '@/lib/safeStorage'

const EMAIL_KEY = 'tt-email-for-signin'

export async function sendEmailLink(email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, { url: `${window.location.origin}/login`, handleCodeInApp: true })
  writeStorage(EMAIL_KEY, email)
}

export const googleSignIn = () => signInWithPopup(auth, new GoogleAuthProvider())

export const signOut = () => fbSignOut(auth)

/** True when the current URL is an email sign-in link. */
export const isEmailLinkUrl = () => isSignInWithEmailLink(auth, window.location.href)

export const rememberedEmail = () => readStorage(EMAIL_KEY)

/** Complete email-link sign-in. If the link was opened on another device, `email` must be supplied. */
export async function completeEmailLink(email: string): Promise<void> {
  await signInWithEmailLink(auth, email, window.location.href)
  try {
    localStorage.removeItem(EMAIL_KEY)
  } catch {
    /* ignore */
  }
}
