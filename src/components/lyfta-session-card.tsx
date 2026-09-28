import { Dumbbell } from 'lucide-react'
import { motion } from 'motion/react'
import type { LyftaWorkout } from '@/lib/lyfta'

function findPr(workout: LyftaWorkout) {
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (set.recordType && set.recordValue) return `PR · ${exercise.name} ${set.recordValue}`
    }
  }
  return null
}

function totalSets(workout: LyftaWorkout) {
  return workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
}

/** Restyled Forge "last session" card, fed by the latest Lyfta workout. Renders nothing if there is no workout to show. */
export function LyftaSessionCard({ workout }: { workout: LyftaWorkout | null }) {
  if (!workout) return null
  const pr = findPr(workout)
  const sets = totalSets(workout)

  return (
    <div className="glass relative overflow-hidden p-5">
      <Dumbbell className="pointer-events-none absolute -right-4 -bottom-5 size-32 rotate-[-20deg] text-lime-400/10" />
      {pr && (
        <span
          className="absolute top-4 right-4 rounded-lg px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-[#1a1200]"
          style={{ background: 'linear-gradient(110deg, #ffb347 20%, #fff3c4 40%, #ffb347 60%)', backgroundSize: '250% 100%', animation: 'liquid-wave 2.4s linear infinite' }}
        >
          {pr.toUpperCase()}
        </span>
      )}
      <p className="text-[0.7rem] font-bold tracking-[0.16em] text-lime-400">LAST SESSION &middot; LYFTA</p>
      <motion.h3 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-2xl font-bold tracking-tight">{workout.title}</motion.h3>
      <div className="relative mt-3 flex gap-5 text-sm text-muted-foreground">
        <div><b className="block text-lg font-bold text-foreground">{workout.duration ?? '—'}</b>duration</div>
        <div><b className="block text-lg font-bold text-foreground">{workout.totalVolume ?? '—'}</b>volume</div>
        <div><b className="block text-lg font-bold text-foreground">{sets}</b>sets</div>
      </div>
    </div>
  )
}
