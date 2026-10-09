import { NavLink } from 'react-router-dom'
import { Logo } from '@/brand/Logo'
import { Icon } from '@/components/ui/Icon'
import { PageTransition } from '@/components/ui/PageTransition'
import { Stripes } from '@/components/ui/Stripes'
import { SyncChip } from '@/components/ui/SyncChip'
import type { NavItem } from './nav'

/**
 * Shared shell: left rail on desktop (md+), bottom tab bar on mobile. Header carries the
 * logo, a stripe flourish and the global sync chip. Safe-area insets respected throughout.
 */
export function AppShell({ items }: { items: readonly NavItem[] }) {
  return (
    <div className="min-h-dvh md:pl-56">
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col gap-2 border-r border-border bg-surface p-4 md:flex"
        style={{ paddingTop: 'calc(var(--safe-top) + 16px)' }}
        aria-label="Primary"
      >
        <Logo height={44} className="mb-4" />
        <nav className="flex flex-col gap-1">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.to === '/me'}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold ${isActive ? 'bg-primary text-primary-fg' : 'text-fg hover:bg-surface-2'}`
              }
            >
              <Icon name={i.icon} />
              {i.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <header
        className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="flex min-h-14 items-center justify-between gap-3 px-4">
          <Logo height={32} className="md:hidden" />
          <span className="hidden md:block" />
          <SyncChip />
        </div>
        <Stripes bands={2} className="w-full opacity-80" />
      </header>

      <main className="mx-auto max-w-5xl pb-28 md:pb-8">
        <PageTransition />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-surface md:hidden"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)`, paddingBottom: 'var(--safe-bottom)' }}
        aria-label="Primary"
      >
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.to === '/me'}
            className={({ isActive }) =>
              `flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${isActive ? 'text-primary-text' : 'text-muted'}`
            }
          >
            <Icon name={i.icon} />
            {i.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
