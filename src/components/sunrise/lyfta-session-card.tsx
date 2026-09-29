import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Trophy } from 'lucide-react'
import type { LyftaSet, LyftaWorkout } from '@/lib/lyfta'

const dayFormatter = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' })

export function workoutDate(value: string | null) {
  if (!value) return null
  const date = new Date(value.includes(' ') ? value.replace(' ', 'T') : value)
  return Number.isNaN(date.getTime()) ? value : dayFormatter.format(date)
}

/** Human-readable "weight x reps" (or reps/duration alone) for one set. LyftaSet's numeric fields are already display-clean (see normalizeSet in lib/lyfta.ts). */
export function formatSetSummary(set: LyftaSet) {
  if (set.weight && set.reps) return `${set.weight} x ${set.reps}`
  if (set.reps) return `${set.reps} reps`
  if (set.duration) return set.duration
  return null
}

/** First set Lyfta flagged as a personal record, if any. record_value is an opaque internal
 * composite (e.g. "51,35.000,455,13"), not user-facing, so we describe the PR from the set itself. */
export function workoutRecord(workout: LyftaWorkout) {
  for (const exercise of workout.exercises) {
    const set = exercise.sets.find((item) => item.recordType && item.recordValue)
    if (set) return { exercise: exercise.name, value: formatSetSummary(set) ?? '', type: set.recordType as string }
  }
  return null
}

export function LyftaSessionCard({ workout, className, style }: { workout: LyftaWorkout; className?: string; style?: React.CSSProperties }) {
  const sets = workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
  const record = workoutRecord(workout)
  const performed = workoutDate(workout.performedAt)

  return (
    <Link to="/lyfta" className={`group relative block overflow-hidden rounded-[1.8rem] border border-sun/20 bg-[linear-gradient(140deg,#3a1d2e_0%,#241a3d_55%,#1c1836_100%)] p-5 ${className ?? ''}`} style={style}>
      <svg viewBox="0 0 120 40" className="anim-sway pointer-events-none absolute -right-4 -bottom-3 w-36 opacity-20" style={{ transformOrigin: '60px 20px' }} aria-hidden="true">
        <g fill="#ff9447"><rect x="0" y="6" width="14" height="28" rx="3" /><rect x="14" y="2" width="10" height="36" rx="3" /><rect x="24" y="16" width="72" height="8" rx="2" /><rect x="96" y="2" width="10" height="36" rx="3" /><rect x="106" y="6" width="14" height="28" rx="3" /></g>
      </svg>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-extrabold tracking-[0.16em] text-sun uppercase">Last session · Lyfta</p>
        <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <h3 className="mt-1.5 text-[1.9rem] leading-none font-extrabold tracking-tight text-cream">{workout.title}</h3>
      {performed && <p className="mt-1.5 text-sm font-semibold text-muted-foreground">{performed}</p>}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[['Time', workout.duration], ['Volume', workout.totalVolume], ['Sets', sets ? String(sets) : null]].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/6 px-3 py-2.5">
            <p className="truncate text-lg leading-tight font-extrabold text-cream">{value || '—'}</p>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      {record && (
        <div className="pop sun-shimmer mt-4 inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-extrabold text-[#3a1a05]" style={{ '--d': 4 } as React.CSSProperties}>
          <Trophy className="size-4 shrink-0" strokeWidth={2.6} />
          <span className="truncate">PR · {record.exercise}{record.value ? ` · ${record.value}` : ''}</span>
        </div>
      )}
    </Link>
  )
}
