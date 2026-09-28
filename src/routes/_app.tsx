import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Activity, ChartNoAxesCombined, NotebookTabs, UserRound } from 'lucide-react'
import { MotionConfig } from 'motion/react'
import { AuroraBackground } from '@/components/aurora-background'
import { BottomNav } from '@/components/bottom-nav'
import { DailyCheckinDialogProvider } from '@/components/daily-checkin-dialog'
import { Button } from '@/components/ui/button'
import { getProfileData, getTodayCheckin } from '@/lib/app.functions'

export const Route = createFileRoute('/_app')({
  loader: async () => {
    const [existing, profile] = await Promise.all([getTodayCheckin(), getProfileData()])
    return { existing, profile }
  },
  component: AppLayout,
})

const navigation = [
  { to: '/', label: 'Today', icon: Activity },
  { to: '/recipes', label: 'Recipes', icon: NotebookTabs },
  { to: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
  { to: '/profile', label: 'Profile', icon: UserRound },
] as const

function AppLayout() {
  const data = Route.useLoaderData()
  return (
    <MotionConfig reducedMotion="user">
      <DailyCheckinDialogProvider existing={data.existing} profile={data.profile}><AppShell /></DailyCheckinDialogProvider>
    </MotionConfig>
  )
}

function AppShell() {
  return (
    <div className="dark relative min-h-screen bg-background text-foreground">
      <AuroraBackground />

      <header className="glass sticky top-3 z-30 mx-3 flex h-12 items-center rounded-2xl px-4 lg:hidden">
        <Link to="/" className="font-heading text-base font-semibold">Sian OS</Link>
        <span className="ml-auto text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary">Wellness OS</span>
      </header>

      <aside className="glass fixed inset-y-3 left-3 z-30 hidden w-64 flex-col rounded-3xl p-4 lg:flex">
        <div className="px-3 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">Personal Wellness OS</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-aurora-gradient">Sian OS</p>
        </div>
        <DesktopNavigation />
        <div className="mt-auto border-t border-white/10 pt-4">
          <Button render={<a href="/api/export" />} variant="ghost" className="h-auto w-full justify-start rounded-xl px-3 py-2 text-sm text-muted-foreground">Export all data</Button>
        </div>
      </aside>

      <main className="relative z-10 min-h-screen pb-28 lg:pb-0 lg:pl-72"><Outlet /></main>

      <BottomNav />
    </div>
  )
}

function DesktopNavigation() {
  return <nav className="mt-2 grid gap-1">
    <Button render={<Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'bg-primary text-primary-foreground' }} />} variant="ghost" className="h-auto justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground"><Activity className="size-4" /> Today</Button>
    {navigation.slice(1).map(({ to, label, icon: Icon }) => (
      <Button key={to} render={<Link to={to} activeProps={{ className: 'bg-primary text-primary-foreground' }} />} variant="ghost" className="h-auto justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground"><Icon className="size-4" /> {label}</Button>
    ))}
  </nav>
}
