import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { FinanceBottomNav, FinanceDesktopSidebar } from '@/components/finance/finance-nav'

export const Route = createFileRoute('/finance')({ component: FinanceLayout })

function FinanceLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <FinanceShell />
    </MotionConfig>
  )
}

function FinanceShell() {
  // See `_app.tsx`'s identical comment: `resolvedLocation` (not `location`) so the
  // entrance animation replays once the destination route has actually committed.
  const pathname = useRouterState({ select: (state) => (state.resolvedLocation ?? state.location).pathname })
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(80%_100%_at_70%_0%,rgb(45_212_191/.12),transparent_70%)]" />
      <FinanceDesktopSidebar />
      <main className="relative min-h-screen pt-[env(safe-area-inset-top)] lg:pl-68">
        <div key={pathname} className="rise">
          <Outlet />
        </div>
      </main>
      <FinanceBottomNav />
    </div>
  )
}
