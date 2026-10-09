import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Logo } from '@/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Stripes } from '@/components/ui/Stripes'
import { isConfigured } from '@/lib/firebase'
import { toast } from '@/stores/toasts'
import { useAuth } from './authStore'
import { completeEmailLink, googleSignIn, isEmailLinkUrl, rememberedEmail, sendEmailLink } from './signIn'

type Phase = 'form' | 'sent' | 'confirmEmail'

export function LoginPage() {
  const status = useAuth((s) => s.status)
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<Phase>(() =>
    isEmailLinkUrl() && !rememberedEmail() ? 'confirmEmail' : 'form',
  )
  const [busy, setBusy] = useState(false)

  // Returning from an email link: finish sign-in (ask for the email if opened on another device).
  useEffect(() => {
    if (!isEmailLinkUrl()) return
    const saved = rememberedEmail()
    if (!saved) return // phase already 'confirmEmail': the form asks for the address
    completeEmailLink(saved).catch(() => toast.error('That sign-in link expired. Request a new one.'))
  }, [])

  if (status === 'ready') return <Navigate to="/" replace />

  const run = async (fn: () => Promise<void>, failure: string) => {
    setBusy(true)
    try {
      await fn()
    } catch {
      toast.error(failure)
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    if (phase === 'confirmEmail') {
      void run(() => completeEmailLink(email.trim()), 'Could not sign in. Check the email and try again.')
      return
    }
    void run(async () => {
      await sendEmailLink(email.trim())
      setPhase('sent')
    }, 'Could not send the link. Check the address and your connection.')
  }

  return (
    <div className="mx-auto grid min-h-dvh max-w-sm content-center gap-6 p-6">
      <div className="flex flex-col items-center gap-4">
        <Logo height={80} animated />
        <Stripes className="w-48" />
        <h1 className="font-display text-3xl">Strength &amp; Conditioning</h1>
      </div>

      {phase === 'sent' ? (
        <p className="rounded-xl bg-surface-2 p-4 text-center" role="status">
          Check <strong>{email}</strong> for your sign-in link. You can close this tab.
        </p>
      ) : (
        <form onSubmit={submit} className="grid gap-3">
          <label className="grid gap-1 text-sm font-semibold">
            {phase === 'confirmEmail' ? 'Confirm your email to finish signing in' : 'Email'}
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal"
            />
          </label>
          <Button type="submit" disabled={busy}>
            {phase === 'confirmEmail' ? 'Finish sign-in' : 'Email me a sign-in link'}
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => void run(async () => void (await googleSignIn()), 'Google sign-in failed.')}
          >
            Continue with Google
          </Button>
        </form>
      )}

      {!isConfigured ? (
        <p className="text-center text-xs text-muted">
          Firebase isn&apos;t configured: running against local emulators. See README setup.
        </p>
      ) : null}
    </div>
  )
}
