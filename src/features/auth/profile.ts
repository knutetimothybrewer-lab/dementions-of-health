import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db, ORG_ID } from '@/lib/firebase'
import { trackWrite } from '@/stores/sync'
import type { Invite, UserProfile } from './roles'

const userRef = (uid: string) => doc(db, 'users', uid)
const inviteRef = (email: string) => doc(db, 'invites', email.toLowerCase())
const orgRef = (orgId: string) => doc(db, 'orgs', orgId)

export type ProvisionResult =
  | { kind: 'profile'; profile: UserProfile }
  | { kind: 'noAccess' }

/**
 * Resolve the signed-in user's profile, creating it when allowed:
 *  1. existing users/{uid} doc wins;
 *  2. an invite for the user's email (invites/{email}) creates a profile with the invited role;
 *  3. if the org doesn't exist yet, the first user bootstraps it and becomes admin (owner).
 * Anything else is "no access": a coach must invite this email first.
 */
export async function provisionProfile(user: User): Promise<ProvisionResult> {
  const existing = await getDoc(userRef(user.uid))
  if (existing.exists()) return { kind: 'profile', profile: existing.data() as UserProfile }

  const email = user.email?.toLowerCase() ?? ''
  const displayName = user.displayName ?? email.split('@')[0] ?? 'Coach'

  if (email) {
    const invite = await getDoc(inviteRef(email))
    if (invite.exists()) {
      const inv = invite.data() as Invite
      const profile: UserProfile = {
        uid: user.uid,
        orgId: inv.orgId,
        role: inv.role,
        displayName,
        email,
        ...(inv.linkedAthleteId ? { linkedAthleteId: inv.linkedAthleteId } : {}),
      }
      await trackWrite(setDoc(userRef(user.uid), { ...profile, createdAt: serverTimestamp() }))
      return { kind: 'profile', profile }
    }
  }

  const org = await getDoc(orgRef(ORG_ID))
  if (!org.exists()) {
    const profile: UserProfile = { uid: user.uid, orgId: ORG_ID, role: 'admin', displayName, email }
    await trackWrite(
      runTransaction(db, async (tx) => {
        const fresh = await tx.get(orgRef(ORG_ID))
        if (fresh.exists()) throw new Error('org-exists')
        tx.set(orgRef(ORG_ID), {
          name: 'Top Tier Physical Therapy',
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
          settings: { unit: 'lb', freeTextNotes: true },
        })
        tx.set(userRef(user.uid), { ...profile, createdAt: serverTimestamp() })
      }),
    )
    return { kind: 'profile', profile }
  }
  return { kind: 'noAccess' }
}
