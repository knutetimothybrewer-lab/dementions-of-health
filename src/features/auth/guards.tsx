import { Navigate, Outlet } from 'react-router-dom'
import { Logo } from '@/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Stripes } from '@/components/ui/Stripes'
import { useAuth } from './authStore'
import { homePathFor, isCoachRole } from './roles'
import { signOut } from './signIn'

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-6" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-6">
        <Logo height={72} animated />
        <Stripes className="w-48" />
      </div>
    </div>
  )
}

function Blocked({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <Logo height={56} />
        <Stripes className="w-40" />
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="text-muted">{body}</p>
        <Button variant="secondary" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

/** Gate for any signed-in route. Renders the matched child route via <Outlet/>. */
export function RequireAuth() {
  const status = useAuth((s) => s.status)
  if (status === 'loading') return <Splash />
  if (status === 'signedOut') return <Navigate to="/login" replace />
  if (status === 'noAccess')
    return (
      <Blocked
        title="Ask your coach for an invite"
        body="This email isn't linked to a Top Tier account yet. An admin can invite it from Settings."
      />
    )
  if (status === 'error')
    return (
      <Blocked
        title="Can't load your account"
        body="Check your connection and try again. You need to be online the first time you sign in on a device."
      />
    )
  return <Outlet />
}

/** Role gate: coaches/admins vs athletes get different shells. */
export function RequireRole({ coach }: { coach: boolean }) {
  const profile = useAuth((s) => s.profile)
  if (!profile) return <Splash />
  if (isCoachRole(profile.role) !== coach) return <Navigate to={homePathFor(profile.role)} replace />
  return <Outlet />
}

/** Send signed-in users from "/" to their home. */
export function HomeRedirect() {
  const profile = useAuth((s) => s.profile)
  return <Navigate to={profile ? homePathFor(profile.role) : '/login'} replace />
}
