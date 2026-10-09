import { MotionToggle, ThemeToggle } from '@/components/ui/DisplayToggles'
import { Button } from '@/components/ui/Button'
import { Stripes } from '@/components/ui/Stripes'
import { useAuth } from '@/features/auth/authStore'
import { signOut } from '@/features/auth/signIn'

export default function More() {
  const profile = useAuth((s) => s.profile)
  return (
    <div className="grid gap-4 p-4">
      <h1 className="font-display text-4xl">More</h1>
      <Stripes className="w-32" />
      <section className="grid gap-3" aria-label="Display">
        <h2 className="font-display text-2xl">Display</h2>
        <ThemeToggle />
        <MotionToggle />
      </section>
      <section className="grid gap-3" aria-label="Account">
        <h2 className="font-display text-2xl">Account</h2>
        <p className="text-muted">
          {profile?.displayName} · {profile?.email} · {profile?.role}
        </p>
        <Button variant="secondary" onClick={() => void signOut()}>
          Sign out
        </Button>
      </section>
    </div>
  )
}
