import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useToasts, type Toast } from '@/stores/toasts'

const TONE: Record<Toast['tone'], string> = {
  info: 'bg-primary text-primary-fg',
  success: 'bg-success text-white',
  error: 'bg-danger text-white',
}

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useToasts((s) => s.dismiss)
  useEffect(() => {
    const id = setTimeout(() => dismiss(t.id), t.undo ? 7000 : 4000)
    return () => clearTimeout(id)
  }, [t.id, t.undo, dismiss])
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg ${TONE[t.tone]}`}
    >
      <span className="flex-1 text-sm font-medium">{t.message}</span>
      {t.undo ? (
        <button
          type="button"
          className="min-h-12 cursor-pointer rounded-lg px-3 text-sm font-bold underline"
          onClick={() => {
            t.undo?.()
            dismiss(t.id)
          }}
        >
          Undo
        </button>
      ) : null}
    </motion.div>
  )
}

export function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 mx-auto flex max-w-md flex-col gap-2 px-4"
      style={{ bottom: 'calc(var(--safe-bottom) + 88px)' }}
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
