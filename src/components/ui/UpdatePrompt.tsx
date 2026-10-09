import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './Button'

/** Offline shell + update prompt: the new version only activates when the coach chooses (never mid-session). */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()
  if (!needRefresh && !offlineReady) return null
  const close = () => {
    setNeedRefresh(false)
    setOfflineReady(false)
  }
  return (
    <div
      role="alert"
      className="fixed inset-x-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-primary p-3 text-primary-fg shadow-lg"
      style={{ top: 'calc(var(--safe-top) + 12px)' }}
    >
      <span className="flex-1 text-sm font-medium">
        {needRefresh ? 'A new version is ready.' : 'Ready to work offline.'}
      </span>
      {needRefresh ? (
        <Button variant="accent" onClick={() => updateServiceWorker(true)}>
          Update
        </Button>
      ) : null}
      <Button variant="secondary" onClick={close} aria-label="Dismiss">
        {needRefresh ? 'Later' : 'OK'}
      </Button>
    </div>
  )
}
