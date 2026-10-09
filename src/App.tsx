import { lazy, Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ATHLETE_NAV, COACH_NAV } from '@/components/layout/nav'
import { ScreenSkeleton } from '@/components/ui/Skeleton'
import { Toaster } from '@/components/ui/Toaster'
import { ThemeSync } from '@/components/ui/ThemeSync'
import { UpdatePrompt } from '@/components/ui/UpdatePrompt'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { HomeRedirect, RequireAuth, RequireRole } from '@/features/auth/guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { useUi } from '@/stores/ui'

// Route-level code splitting keeps first load small.
const Today = lazy(() => import('@/pages/Today'))
const Athletes = lazy(() => import('@/pages/Athletes'))
const Programs = lazy(() => import('@/pages/Programs'))
const Library = lazy(() => import('@/pages/Library'))
const More = lazy(() => import('@/pages/More'))
const AthleteToday = lazy(() => import('@/pages/AthleteToday'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const page = (el: React.ReactElement) => <Suspense fallback={<ScreenSkeleton />}>{el}</Suspense>

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <HomeRedirect /> },
      {
        element: <RequireRole coach />,
        children: [
          {
            element: <AppShell items={COACH_NAV} />,
            children: [
              { path: '/today', element: page(<Today />) },
              { path: '/athletes', element: page(<Athletes />) },
              { path: '/programs', element: page(<Programs />) },
              { path: '/library', element: page(<Library />) },
              { path: '/more', element: page(<More />) },
            ],
          },
        ],
      },
      {
        element: <RequireRole coach={false} />,
        children: [
          {
            element: <AppShell items={ATHLETE_NAV} />,
            children: [
              { path: '/me', element: page(<AthleteToday />) },
              { path: '/me/more', element: page(<More />) },
              { path: '/me/progress', element: <Navigate to="/me" replace /> },
            ],
          },
        ],
      },
      { path: '*', element: page(<NotFound />) },
    ],
  },
])

export function App() {
  const motion = useUi((s) => s.motion)
  return (
    <MotionConfig reducedMotion={motion === 'reduce' ? 'always' : motion === 'full' ? 'never' : 'user'}>
      <ThemeSync />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Toaster />
      <UpdatePrompt />
    </MotionConfig>
  )
}
