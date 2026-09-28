import { Link, useRouterState } from '@tanstack/react-router'
import { ChartNoAxesColumn, CookingPot, Plus, Sun, UserRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useDailyCheckinDialog } from '@/components/daily-checkin-dialog'
import { SunMark } from '@/components/sunrise/illustrations'
import { cn } from '@/lib/utils'

export const navigation = [
  { to: '/', label: 'Today', icon: Sun, match: (path: string) => path === '/' },
  { to: '/recipes', label: 'Recipes', icon: CookingPot, match: (path: string) => path.startsWith('/recipes') },
  { to: '/reports', label: 'Reports', icon: ChartNoAxesColumn, match: (path: string) => path.startsWith('/reports') },
  { to: '/profile', label: 'You', icon: UserRound, match: (path: string) => ['/profile', '/lyfta', '/gallery'].some((prefix) => path.startsWith(prefix)) },
] as const

const spring = { type: 'spring', bounce: 0.28, duration: 0.5 } as const

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { openCheckin } = useDailyCheckinDialog()

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-2.5 px-3 pb-[calc(env(safe-area-inset-bottom)+14px)] lg:hidden" aria-label="Primary navigation">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/10 bg-[#221d40]/85 p-1.5 shadow-[0_20px_44px_-14px_rgb(0_0_0/.75)] backdrop-blur-xl">
        {navigation.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <Link key={to} to={to} aria-label={label} aria-current={active ? 'page' : undefined} className={cn('relative flex h-12 items-center gap-2 rounded-full px-3.5 text-sm font-bold transition-colors min-[380px]:px-4', active ? 'text-[#1d1330]' : 'text-muted-foreground hover:text-cream')}>
              {active && <motion.span layoutId="nav-pill" transition={spring} className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#ff6b2c,#ff9447)] shadow-[0_6px_18px_-4px_rgb(255_107_44/.7)]" />}
              <Icon className="relative size-5" strokeWidth={2.3} />
              <AnimatePresence initial={false}>
                {active && <motion.span key="label" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={spring} className="relative overflow-hidden whitespace-nowrap">{label}</motion.span>}
              </AnimatePresence>
            </Link>
          )
        })}
      </div>
      <motion.button type="button" whileTap={{ scale: 0.88, rotate: -8 }} transition={spring} onClick={() => openCheckin()} aria-label="Open daily check-in" className="pointer-events-auto grid size-[3.75rem] shrink-0 place-items-center rounded-[1.4rem] bg-cream text-[#1d1330] shadow-[0_16px_34px_-10px_rgb(255_245_232/.45)]">
        <Plus className="size-7" strokeWidth={2.8} />
      </motion.button>
    </nav>
  )
}

export function DesktopSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { openCheckin } = useDailyCheckinDialog()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 flex-col border-r border-white/7 bg-[linear-gradient(180deg,#1b1533,#120f24)] p-5 lg:flex">
      <Link to="/" className="flex items-center gap-3 px-2 py-3">
        <SunMark className="size-11" />
        <div><p className="text-xl font-extrabold tracking-tight text-cream">Sian OS</p><p className="text-xs font-semibold text-muted-foreground">Rise. Fuel. Recover.</p></div>
      </Link>
      <nav className="mt-6 grid gap-1.5" aria-label="Primary navigation">
        {navigation.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={cn('relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[0.95rem] font-bold transition-colors', active ? 'text-[#1d1330]' : 'text-muted-foreground hover:bg-white/5 hover:text-cream')}>
              {active && <motion.span layoutId="sidebar-pill" transition={spring} className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,#ff6b2c,#ff9447)]" />}
              <Icon className="relative size-5" strokeWidth={2.3} />
              <span className="relative">{label === 'You' ? 'Profile' : label}</span>
            </Link>
          )
        })}
      </nav>
      <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => openCheckin()} className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-cream px-4 py-3 font-extrabold text-[#1d1330]">
        <Plus className="size-5" strokeWidth={2.8} /> Daily check-in
      </motion.button>
      <a href="/api/export" className="mt-auto rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-white/5 hover:text-cream">Export all data</a>
    </aside>
  )
}
