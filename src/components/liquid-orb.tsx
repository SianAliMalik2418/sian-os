import { motion } from 'motion/react'
import { useCountUp } from '@/lib/use-count-up'

/** Aurora "liquid fill" orb used for calories/protein goal progress. */
export function LiquidOrb({ label, value, goal, unit, decimals = 0, color, size = 128 }: {
  label: string
  value: number
  goal?: number
  unit: string
  decimals?: number
  color: string
  size?: number
}) {
  const percent = goal && goal > 0 ? Math.min(100, Math.max(0, (value / goal) * 100)) : 0
  const displayValue = useCountUp(value)

  return (
    <div className="grid justify-items-center gap-2">
      <div className="relative overflow-hidden rounded-full border border-white/15 bg-white/5 shadow-[inset_0_0_30px_rgb(255_255_255/0.06)]" style={{ width: size, height: size }}>
        <motion.div
          className="absolute inset-x-0 bottom-0"
          style={{ background: `linear-gradient(180deg, ${color}55, ${color}aa)` }}
          initial={{ height: 0 }}
          animate={{ height: `${percent}%` }}
          transition={{ duration: 1.4, ease: [0.3, 0.9, 0.2, 1] }}
        >
          <svg className="absolute bottom-full left-0 w-[200%]" height="14" viewBox="0 0 200 14" preserveAspectRatio="none" style={{ animation: 'liquid-wave 2.4s linear infinite' }}>
            <path d="M0 7 Q 25 0 50 7 T 100 7 T 150 7 T 200 7 V14 H0 Z" fill={`${color}88`} />
          </svg>
        </motion.div>
        <div className="absolute inset-0 z-10 grid place-content-center text-center">
          <b className="text-2xl font-bold tracking-tight tabular-nums">{Math.round(displayValue).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</b>
          <small className="text-[0.65rem] text-muted-foreground">{unit}{goal ? ` / ${goal}` : ''}</small>
        </div>
      </div>
      <p className="text-xs text-muted-foreground"><b className="text-foreground">{label}</b></p>
    </div>
  )
}
