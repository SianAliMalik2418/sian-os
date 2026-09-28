import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Flame, Footprints, Moon, Scale, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { LiquidOrb } from '@/components/liquid-orb'
import { LyftaSessionCard } from '@/components/lyfta-session-card'
import { NutritionEntryTracker } from '@/components/nutrition-entry-tracker'
import { WeightTrendCard } from '@/components/weight-trend-card'
import { getCoachNote, getDashboardData, getLatestLyftaWorkout } from '@/lib/app.functions'
import { useCountUp } from '@/lib/use-count-up'

export const Route = createFileRoute('/_app/')({
  loader: async () => {
    const [dashboard, latestWorkout, coachNote] = await Promise.all([getDashboardData(), getLatestLyftaWorkout(), getCoachNote()])
    return { dashboard, latestWorkout, coachNote }
  },
  component: Dashboard,
})

function formatValue(value: number | null | undefined, suffix = '') {
  return value === null || value === undefined ? '—' : `${value}${suffix}`
}

const cardMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

function Dashboard() {
  const { dashboard: data, latestWorkout, coachNote } = Route.useLoaderData()
  const router = useRouter()
  const [checkin, setCheckin] = useState(data.checkin)
  const calorieGoal = data.profile?.calorie_goal || 2200
  const proteinGoal = data.profile?.protein_goal || 100
  const todayIso = new Date().toISOString().slice(0, 10)
  const completedDays = new Set(data.weeklyCheckins.map((item) => item.date))
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    const day = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() - day + 1 + index)
    return { date: date.toISOString().slice(0, 10), label: date.toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' }) }
  })
  const todayDate = new Date().toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  const streakCount = useCountUp(data.streak)

  useEffect(() => {
    setCheckin(data.checkin)
  }, [data.checkin])

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <motion.header {...cardMotion} transition={{ duration: 0.4 }} className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{todayDate} &middot; <span className="tabular-nums">{Math.round(streakCount)}</span> day streak</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Locked in, <span className="text-aurora-gradient">Sian.</span></h1>
        </div>
      </motion.header>

      <motion.section {...cardMotion} transition={{ duration: 0.4, delay: 0.05 }} className="glass grid grid-cols-2 gap-2 p-4 sm:grid-cols-[1.25fr_1fr]">
        <LiquidOrb label="Calories" value={checkin?.calories ?? 0} goal={calorieGoal} unit="kcal" color="#22d3ee" size={140} />
        <LiquidOrb label="Protein" value={checkin?.protein_grams ?? 0} goal={proteinGoal} unit="g" color="#a3e635" size={140} />
      </motion.section>

      <motion.section {...cardMotion} transition={{ duration: 0.4, delay: 0.1 }} className="glass p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> This week</span>
          <span>{data.weeklyCheckins.length}/7 complete</span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {weekDays.map((day, index) => {
            const isCompleted = completedDays.has(day.date)
            const isToday = day.date === todayIso
            return (
              <motion.div
                key={day.date}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.06 + 0.3, type: 'spring', stiffness: 300, damping: 18 }}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] ${isCompleted ? 'bg-gradient-to-b from-cyan-400/30 to-lime-400/20 text-lime-300' : isToday ? 'border border-dashed border-primary/60 text-primary' : 'text-muted-foreground'}`}
              >
                {day.label}
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      <motion.div {...cardMotion} transition={{ duration: 0.4, delay: 0.15 }}>
        <WeightTrendCard points={data.weightTrend} />
      </motion.div>

      <motion.section {...cardMotion} transition={{ duration: 0.4, delay: 0.2 }} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Weight', value: formatValue(checkin?.weight_kg, ' kg'), icon: Scale, color: '#67e8f9' },
          { label: 'Steps', value: formatValue(checkin?.steps), icon: Footprints, color: '#a3e635' },
          { label: 'Active cal', value: formatValue(checkin?.active_calories, ' kcal'), icon: Flame, color: '#fb923c' },
          { label: 'Sleep', value: formatValue(checkin?.sleep_hours, ' hrs'), icon: Moon, color: '#8b5cf6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass p-3.5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><span className="grid size-7 place-items-center rounded-lg bg-white/8" style={{ color }}><Icon className="size-4" /></span>{label}</p>
            <b className="mt-3 block text-xl font-bold tracking-tight tabular-nums">{value}</b>
          </div>
        ))}
      </motion.section>

      {latestWorkout && (
        <motion.div {...cardMotion} transition={{ duration: 0.4, delay: 0.25 }}>
          <LyftaSessionCard workout={latestWorkout} />
        </motion.div>
      )}

      {coachNote && (
        <motion.div {...cardMotion} transition={{ duration: 0.4, delay: 0.3 }} className="glass grid grid-cols-[36px_1fr] gap-3 p-4">
          <div className="size-9 rounded-xl" style={{ background: 'conic-gradient(from 0deg, #22d3ee, #8b5cf6, #a3e635, #22d3ee)' }} />
          <div>
            <small className="mb-1 block text-[0.65rem] font-semibold tracking-[0.08em] text-muted-foreground">LAST NIGHT&apos;S COACH NOTE</small>
            <p className="text-sm leading-relaxed">{coachNote}</p>
          </div>
        </motion.div>
      )}

      <motion.div {...cardMotion} transition={{ duration: 0.4, delay: 0.35 }}>
        <NutritionEntryTracker date={todayIso} initialEntries={data.nutritionEntries} calorieGoal={calorieGoal} proteinGoal={proteinGoal} onCheckinChange={async (nextCheckin) => {
          setCheckin(nextCheckin)
          await router.invalidate()
        }} />
      </motion.div>
    </div>
  )
}
