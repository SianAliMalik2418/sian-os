import { Link, useRouterState } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Activity, ChartNoAxesCombined, NotebookTabs, Plus, UserRound } from 'lucide-react'
import { useDailyCheckinDialog } from '@/components/daily-checkin-dialog'

const items = [
  { to: '/' as const, label: 'Today', icon: Activity, exact: true },
  { to: '/recipes' as const, label: 'Recipes', icon: NotebookTabs, exact: false },
  { to: '/reports' as const, label: 'Reports', icon: ChartNoAxesCombined, exact: false },
  { to: '/profile' as const, label: 'Profile', icon: UserRound, exact: false },
]

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { openCheckin } = useDailyCheckinDialog()

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
      <nav aria-label="Primary navigation" className="glass flex items-center gap-1 rounded-full p-1.5">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to)
          return (
            <Link key={to} to={to} className="relative flex h-12 items-center gap-2 rounded-full px-3 text-muted-foreground transition-colors" aria-current={active ? 'page' : undefined}>
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-300 to-lime-400"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 ${active ? 'text-[#04121a]' : ''}`}>
                <Icon className="size-5" />
                {active && <span className="text-sm font-semibold">{label}</span>}
              </span>
            </Link>
          )
        })}
      </nav>
      <motion.button
        type="button"
        onClick={() => openCheckin()}
        whileTap={{ scale: 0.9 }}
        aria-label="Check in"
        className="mb-1 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-lime-400 text-[#04121a] shadow-[0_10px_30px_rgb(103_232_249/0.45)]"
      >
        <Plus className="size-6" strokeWidth={3} />
      </motion.button>
    </div>
  )
}
