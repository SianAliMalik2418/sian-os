import { animate, useReducedMotion } from 'motion/react'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { HeaderIllustration } from '@/components/sunrise/illustrations'
import { cn } from '@/lib/utils'

export type Tone = 'sun' | 'mint' | 'butter' | 'lilac' | 'rose'

export const toneClasses: Record<Tone, { tile: string; label: string; text: string }> = {
  sun: { tile: 'bg-[linear-gradient(160deg,rgb(255_107_44/.22),rgb(255_107_44/.06))] border-sun/20', label: 'text-[#ffb38a]', text: 'text-sun' },
  mint: { tile: 'bg-[linear-gradient(160deg,rgb(45_212_191/.2),rgb(45_212_191/.05))] border-mint/20', label: 'text-[#8ff0e0]', text: 'text-mint' },
  butter: { tile: 'bg-[linear-gradient(160deg,rgb(255_210_63/.2),rgb(255_210_63/.05))] border-butter/20', label: 'text-[#ffe28a]', text: 'text-butter' },
  lilac: { tile: 'bg-[linear-gradient(160deg,rgb(167_139_250/.22),rgb(167_139_250/.06))] border-lilac/20', label: 'text-[#cfc0ff]', text: 'text-lilac' },
  rose: { tile: 'bg-[linear-gradient(160deg,rgb(255_122_138/.2),rgb(255_122_138/.05))] border-rose/20', label: 'text-[#ffb3bd]', text: 'text-rose' },
}

const barColors: Record<Tone, [string, string]> = {
  sun: ['#ff6b2c', '#ff8a50'],
  mint: ['#14b8a6', '#2dd4bf'],
  butter: ['#f5b700', '#ffd23f'],
  lilac: ['#8b5cf6', '#a78bfa'],
  rose: ['#f4506a', '#ff7a8a'],
}

/** Page wrapper: consistent width, padding, and room for the floating bottom nav. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl space-y-5 px-4 pt-4 pb-36 sm:px-6 sm:pt-6 lg:px-10 lg:pt-10 lg:pb-14', className)}>{children}</div>
}

/** Dusk-sky header card with a per-page illustration. */
export function PageHeader({ kicker, title, description, illustration, actions, aside }: {
  kicker: string
  title: ReactNode
  description?: ReactNode
  illustration: Parameters<typeof HeaderIllustration>[0]['kind']
  actions?: ReactNode
  aside?: ReactNode
}) {
  return (
    <header className="rise relative overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(170deg,#2a1d4f_0%,#1f1839_55%,#1c1836_100%)] p-5 sm:p-7">
      <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-sun/15 blur-3xl" />
      {[[48, 7], [66, 5], [92, 58], [58, 3]].map(([left, top], index) => <span key={left} className="anim-twinkle absolute size-1 rounded-full bg-cream" style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * 0.6}s` }} />)}
      <HeaderIllustration kind={illustration} className="pointer-events-none absolute top-4 right-1 w-30 sm:top-5 sm:right-6 sm:w-44" />
      <div className="relative max-w-[62%] sm:max-w-[70%]">
        <p className="text-sm font-bold text-sun">{kicker}</p>
        <h1 className="mt-1 text-[2rem] leading-[1.02] font-extrabold tracking-tight text-cream sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {aside && <div className="relative mt-4">{aside}</div>}
      {actions && <div className="relative mt-5 flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function SectionTitle({ title, meta, action, className, style }: { title: ReactNode; meta?: ReactNode; action?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-1 pt-2', className)} style={style}>
      <h2 className="text-xl font-extrabold tracking-tight text-cream">{title}</h2>
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">{meta}{action}</div>
    </div>
  )
}

/** Number that counts up from zero on mount and eases to new values after. */
export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef(0)
  const reduceMotion = useReducedMotion()
  const format = (next: number) => next.toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reduceMotion) {
      node.textContent = format(value)
      previous.current = value
      return
    }
    const controls = animate(previous.current, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1], onUpdate: (next) => { node.textContent = format(next) } })
    previous.current = value
    return () => controls.stop()
  }, [value, reduceMotion])

  return <span ref={ref} className="tabular-nums">{format(value)}</span>
}

/** Chunky striped progress bar. `value` is a 0–100 percentage. */
export function StripeBar({ value, tone = 'sun', className }: { value: number; tone?: Tone; className?: string }) {
  const [a, b] = barColors[tone]
  return (
    <div className={cn('relative h-4 overflow-hidden rounded-full bg-white/7', className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
      <div className="grow-x h-full">
        <div className="sun-stripes h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(.3,1.3,.4,1)]" style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, '--stripe-a': a, '--stripe-b': b } as CSSProperties} />
      </div>
    </div>
  )
}

/** Colored metric tile with a doodle in the corner. */
export function ToneTile({ tone, label, value, footer, doodle, className, style }: {
  tone: Tone
  label: string
  value: ReactNode
  footer?: ReactNode
  doodle?: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const classes = toneClasses[tone]
  return (
    <div className={cn('relative min-h-32 overflow-hidden rounded-[1.6rem] border p-4', classes.tile, className)} style={style}>
      {doodle && <div className="pointer-events-none absolute -right-2 -top-2 opacity-90">{doodle}</div>}
      <p className={cn('text-sm font-bold', classes.label)}>{label}</p>
      <div className="mt-6 text-[1.9rem] leading-none font-extrabold tracking-tight text-cream">{value}</div>
      {footer && <div className="mt-2 text-xs font-semibold text-muted-foreground">{footer}</div>}
    </div>
  )
}

export function Unit({ children }: { children: ReactNode }) {
  return <small className="ml-1 text-sm font-bold text-muted-foreground">{children}</small>
}

export function Notice({ tone, children }: { tone: 'error' | 'status'; children: ReactNode }) {
  return <p role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-2xl px-4 py-3 text-sm font-semibold', tone === 'error' ? 'bg-destructive/12 text-destructive-foreground' : 'bg-mint/12 text-mint')}>{children}</p>
}
