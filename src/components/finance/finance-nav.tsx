import { Link, useRouterState } from '@tanstack/react-router'
import { HandCoins, LayoutGrid, Settings, Sun, Wallet } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

const navigation = [
  { to: '/finance', label: 'Overview', icon: LayoutGrid, match: (path: string) => path === '/finance' },
  { to: '/finance/transactions', label: 'Transactions', icon: Wallet, match: (path: string) => path.startsWith('/finance/transactions') },
  { to: '/finance/debts', label: 'Debts', icon: HandCoins, match: (path: string) => path.startsWith('/finance/debts') },
  { to: '/finance/settings', label: 'Settings', icon: Settings, match: (path: string) => path.startsWith('/finance/settings') },
] as const

const spring = { type: 'spring', bounce: 0.28, duration: 0.5 } as const

export function FinanceBottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-2.5 px-3 pb-[calc(env(safe-area-inset-bottom)+14px)] lg:hidden" aria-label="Finance navigation">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/10 bg-[#221d40]/85 p-1.5 shadow-[0_20px_44px_-14px_rgb(0_0_0/.75)] backdrop-blur-xl">
        {navigation.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <Link key={to} to={to} aria-label={label} aria-current={active ? 'page' : undefined} className={cn('relative flex h-12 items-center gap-2 rounded-full px-3.5 text-sm font-bold transition-colors min-[380px]:px-4', active ? 'text-[#1d1330]' : 'text-muted-foreground hover:text-cream')}>
              {active && <motion.span layoutId="finance-nav-pill" transition={spring} className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#14b8a6,#2dd4bf)] shadow-[0_6px_18px_-4px_rgb(45_212_191/.6)]" />}
              <Icon className="relative size-5" strokeWidth={2.3} />
              <AnimatePresence initial={false}>
                {active && <motion.span key="label" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={spring} className="relative overflow-hidden whitespace-nowrap">{label}</motion.span>}
              </AnimatePresence>
            </Link>
          )
        })}
      </div>
      <Link to="/" aria-label="Switch to health mode" className="pointer-events-auto grid size-[3.75rem] shrink-0 place-items-center rounded-[1.4rem] bg-cream text-[#1d1330] shadow-[0_16px_34px_-10px_rgb(255_245_232/.45)]">
        <Sun className="size-7" strokeWidth={2.6} />
      </Link>
    </nav>
  )
}

export function FinanceDesktopSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 flex-col border-r border-white/7 bg-[linear-gradient(180deg,#132020,#0f1a1a)] p-5 lg:flex">
      <Link to="/finance" className="flex items-center gap-3 px-2 py-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-mint/15 text-mint"><HandCoins className="size-6" strokeWidth={2.4} /></span>
        <div><p className="text-xl font-extrabold tracking-tight text-cream">Finance</p><p className="text-xs font-semibold text-muted-foreground">Earn. Divide. Save.</p></div>
      </Link>
      <nav className="mt-6 grid gap-1.5" aria-label="Finance navigation">
        {navigation.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={cn('relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[0.95rem] font-bold transition-colors', active ? 'text-[#1d1330]' : 'text-muted-foreground hover:bg-white/5 hover:text-cream')}>
              {active && <motion.span layoutId="finance-sidebar-pill" transition={spring} className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,#14b8a6,#2dd4bf)]" />}
              <Icon className="relative size-5" strokeWidth={2.3} />
              <span className="relative">{label}</span>
            </Link>
          )
        })}
      </nav>
      <Link to="/" className="mt-auto flex items-center justify-center gap-2 rounded-2xl bg-cream px-4 py-3 font-extrabold text-[#1d1330]">
        <Sun className="size-5" strokeWidth={2.6} /> Switch to health
      </Link>
    </aside>
  )
}
