import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Activity, ChartNoAxesCombined, UserRound } from 'lucide-react'
import { DailyCheckinDialogProvider } from '@/components/daily-checkin-dialog'
import { Button } from '@/components/ui/button'
import { getProgressPhotos, getTodayCheckin } from '@/lib/app.functions'

export const Route = createFileRoute('/_app')({
  loader: async () => {
    const [existing, photos] = await Promise.all([getTodayCheckin(), getProgressPhotos()])
    return { existing, photos }
  },
  component: AppLayout,
})

const navigation = [
  { to: '/', label: 'Today', icon: Activity },
  { to: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
  { to: '/profile', label: 'Profile', icon: UserRound },
] as const

function AppLayout() {
  const data = Route.useLoaderData()
  return <DailyCheckinDialogProvider existing={data.existing} photos={data.photos}><AppShell /></DailyCheckinDialogProvider>
}

function AppShell() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link to="/" className="font-heading text-lg font-semibold">Sian OS</Link>
        <span className="ml-auto text-xs font-medium uppercase tracking-[0.2em] text-primary">Wellness OS</span>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 flex-col border-r bg-background p-4 lg:flex">
        <div className="px-3 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">Personal Wellness OS</p>
          <p className="mt-2 font-heading text-2xl font-semibold">Sian OS</p>
        </div>
        <DesktopNavigation />
        <div className="mt-auto border-t pt-4">
          <Button render={<a href="/api/export" />} variant="ghost" className="h-auto w-full justify-start rounded-xl px-3 py-2 text-sm text-muted-foreground">Export all data</Button>
        </div>
      </aside>

      <main className="min-h-screen pb-24 lg:pb-0 lg:pl-64"><Outlet /></main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Primary navigation">
        <div className="mx-auto grid h-18 max-w-md grid-cols-3">
          <MobileLink to="/" label="Today" icon={Activity} exact />
          <MobileLink to="/reports" label="Reports" icon={ChartNoAxesCombined} />
          <MobileLink to="/profile" label="Profile" icon={UserRound} />
        </div>
      </nav>
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

function MobileLink({ to, label, icon: Icon, exact = false }: { to: '/' | '/reports' | '/profile'; label: string; icon: typeof Activity; exact?: boolean }) {
  return <Button render={<Link to={to} activeOptions={{ exact }} activeProps={{ className: 'text-primary' }} />} variant="ghost" className="h-full min-w-0 flex-col gap-1 rounded-xl px-1 text-[0.65rem] font-medium text-muted-foreground"><Icon className="size-5" /><span className="truncate">{label}</span></Button>
}
