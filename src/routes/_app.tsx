import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { DailyCheckinDialogProvider } from '@/components/daily-checkin-dialog'
import { BottomNav, DesktopSidebar } from '@/components/sunrise/bottom-nav'
import { getProfileData, getTodayCheckin } from '@/lib/app.functions'

export const Route = createFileRoute('/_app')({
  loader: async () => {
    const [existing, profile] = await Promise.all([getTodayCheckin(), getProfileData()])
    return { existing, profile }
  },
  component: AppLayout,
})

function AppLayout() {
  const data = Route.useLoaderData()
  return (
    <MotionConfig reducedMotion="user">
      <DailyCheckinDialogProvider existing={data.existing} profile={data.profile}><AppShell /></DailyCheckinDialogProvider>
    </MotionConfig>
  )
}

function AppShell() {
  // `location.pathname` updates the instant navigation starts, before the destination route's
  // loader resolves, so keying on it remounts this wrapper (replaying the old route's entrance
  // animation) before Outlet has even switched away from it. `resolvedLocation` only updates once
  // the new route is actually committed and rendered, so the animation replays once, for the right page.
  const pathname = useRouterState({ select: (state) => (state.resolvedLocation ?? state.location).pathname })
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(80%_100%_at_70%_0%,rgb(255_107_44/.12),transparent_70%)]" />
      <DesktopSidebar />
      <main className="relative min-h-screen pt-[env(safe-area-inset-top)] lg:pl-68">
        <div key={pathname} className="rise">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
