import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
  /** Optional undo handler for destructive actions. */
  undo?: () => void
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => number
  dismiss: (id: number) => void
}

let nextId = 1

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))

export const toast = {
  info: (message: string) => useToasts.getState().push({ message, tone: 'info' }),
  success: (message: string) => useToasts.getState().push({ message, tone: 'success' }),
  error: (message: string) => useToasts.getState().push({ message, tone: 'error' }),
  withUndo: (message: string, undo: () => void) => useToasts.getState().push({ message, tone: 'info', undo }),
}
