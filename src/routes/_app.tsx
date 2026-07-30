import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Activity, ChartNoAxesCombined, ClipboardCheck, Dumbbell, Menu, Scale, X } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_app')({ component: AppLayout })

const navigation = [
  { to: '/', label: 'Today', icon: Activity },
  { to: '/check-in', label: 'Check-in', icon: ClipboardCheck },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/exercises', label: 'Exercises', icon: ChartNoAxesCombined },
  { to: '/progress', label: 'Progress', icon: Scale },
  { to: '/weekly-review', label: 'Weekly review', icon: ClipboardCheck },
] as const

function AppLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link to="/" className="font-heading text-lg font-semibold">Sian OS</Link>
        <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg border p-2" aria-label="Toggle navigation">
          {open ? <X /> : <Menu />}
        </button>
      </header>
      <aside className={`${open ? 'flex' : 'hidden'} fixed inset-x-0 top-16 z-30 h-[calc(100vh-4rem)] flex-col border-r bg-background p-4 lg:inset-y-0 lg:left-0 lg:top-0 lg:flex lg:h-screen lg:w-64`}>
        <div className="hidden px-3 py-5 lg:block">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">Personal Fitness OS</p>
          <p className="mt-2 font-heading text-2xl font-semibold">Sian OS</p>
        </div>
        <nav className="mt-2 grid gap-1">
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: to === '/' }}
              activeProps={{ className: 'bg-primary text-primary-foreground' }}
              inactiveProps={{ className: 'text-muted-foreground hover:bg-accent hover:text-foreground' }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t pt-4">
          <a href="/api/export" className="block rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">Export all data</a>
        </div>
      </aside>
      <main className="min-h-screen lg:pl-64"><Outlet /></main>
    </div>
  )
}
