import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Activity, ChartNoAxesCombined, ClipboardCheck, Dumbbell, MoreHorizontal, Scale } from 'lucide-react'
import { useState } from 'react'
import { DailyCheckinDialogProvider, useDailyCheckinDialog } from '@/components/daily-checkin-dialog'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerDescription, DrawerHeader, DrawerPanel, DrawerPopup, DrawerTitle } from '@/components/ui/drawer'
import { getTodayCheckin } from '@/lib/app.functions'

export const Route = createFileRoute('/_app')({ loader: () => getTodayCheckin(), component: AppLayout })

const navigation = [
  { to: '/', label: 'Today', icon: Activity },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/exercises', label: 'Exercises', icon: ChartNoAxesCombined },
  { to: '/progress', label: 'Progress', icon: Scale },
  { to: '/weekly-review', label: 'Weekly review', icon: ClipboardCheck },
] as const

function AppLayout() {
  return <DailyCheckinDialogProvider existing={Route.useLoaderData()}><AppShell /></DailyCheckinDialogProvider>
}

function AppShell() {
  const { openCheckin } = useDailyCheckinDialog()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link to="/" className="font-heading text-lg font-semibold">Sian OS</Link>
        <span className="ml-auto text-xs font-medium uppercase tracking-[0.2em] text-primary">Fitness OS</span>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 flex-col border-r bg-background p-4 lg:flex">
        <div className="px-3 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">Personal Fitness OS</p>
          <p className="mt-2 font-heading text-2xl font-semibold">Sian OS</p>
        </div>
        <DesktopNavigation onCheckin={openCheckin} />
        <div className="mt-auto border-t pt-4">
          <Button render={<a href="/api/export" />} variant="ghost" className="h-auto w-full justify-start rounded-xl px-3 py-2 text-sm text-muted-foreground">Export all data</Button>
        </div>
      </aside>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen} position="bottom">
        <DrawerPopup showBar showCloseButton className="lg:hidden">
          <DrawerHeader><DrawerTitle>More</DrawerTitle><DrawerDescription>History, review, and data tools</DrawerDescription></DrawerHeader>
          <DrawerPanel className="grid gap-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button render={<Link to="/exercises" onClick={() => setMoreOpen(false)} />} variant="ghost" className="h-12 justify-start gap-3 rounded-xl px-3"><ChartNoAxesCombined className="size-5 text-primary" /> Exercise library</Button>
            <Button render={<Link to="/weekly-review" onClick={() => setMoreOpen(false)} />} variant="ghost" className="h-12 justify-start gap-3 rounded-xl px-3"><ClipboardCheck className="size-5 text-primary" /> Weekly review</Button>
            <Button render={<a href="/api/export" />} variant="ghost" className="h-12 justify-start gap-3 rounded-xl px-3"><Activity className="size-5 text-primary" /> Export all data</Button>
          </DrawerPanel>
        </DrawerPopup>
      </Drawer>

      <main className="min-h-screen pb-24 lg:pb-0 lg:pl-64"><Outlet /></main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Primary navigation">
        <div className="mx-auto grid h-18 max-w-md grid-cols-5">
          <MobileLink to="/" label="Today" icon={Activity} exact />
          <Button type="button" variant="ghost" onClick={openCheckin} className="h-full min-w-0 flex-col gap-1 rounded-xl px-1 text-[0.65rem] font-medium text-muted-foreground"><ClipboardCheck className="size-5" /><span>Check-in</span></Button>
          <MobileLink to="/workouts" label="Workouts" icon={Dumbbell} />
          <MobileLink to="/progress" label="Progress" icon={Scale} />
          <Button type="button" variant="ghost" onClick={() => setMoreOpen((value) => !value)} className={`h-full min-w-0 flex-col gap-1 rounded-xl px-1 text-[0.65rem] font-medium ${moreOpen ? 'text-primary' : 'text-muted-foreground'}`} aria-expanded={moreOpen}>
            <MoreHorizontal className="size-5" /><span>More</span>
          </Button>
        </div>
      </nav>
    </div>
  )
}

function DesktopNavigation({ onCheckin }: { onCheckin: () => void }) {
  return <nav className="mt-2 grid gap-1">
    <Button render={<Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'bg-primary text-primary-foreground' }} />} variant="ghost" className="h-auto justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground"><Activity className="size-4" /> Today</Button>
    <Button type="button" variant="ghost" onClick={onCheckin} className="h-auto justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground"><ClipboardCheck className="size-4" /> Check-in</Button>
    {navigation.slice(1).map(({ to, label, icon: Icon }) => (
      <Button key={to} render={<Link to={to} activeProps={{ className: 'bg-primary text-primary-foreground' }} />} variant="ghost" className="h-auto justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground"><Icon className="size-4" /> {label}</Button>
    ))}
  </nav>
}

function MobileLink({ to, label, icon: Icon, exact = false }: { to: '/' | '/workouts' | '/progress'; label: string; icon: typeof Activity; exact?: boolean }) {
  return <Button render={<Link to={to} activeOptions={{ exact }} activeProps={{ className: 'text-primary' }} />} variant="ghost" className="h-full min-w-0 flex-col gap-1 rounded-xl px-1 text-[0.65rem] font-medium text-muted-foreground"><Icon className="size-5" /><span className="truncate">{label}</span></Button>
}
