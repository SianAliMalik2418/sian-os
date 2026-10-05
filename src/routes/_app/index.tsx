import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Flame, Pencil } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { useDailyCheckinDialog } from '@/components/daily-checkin-dialog'
import { NutritionEntryTracker } from '@/components/nutrition-entry-tracker'
import { EditableNumber } from '@/components/sunrise/editable-number'
import { DaySun, Doodle, SunriseScene } from '@/components/sunrise/illustrations'
import { LyftaSessionCard } from '@/components/sunrise/lyfta-session-card'
import { CountUp, Page, SectionTitle, StripeBar, ToneTile } from '@/components/sunrise/primitives'
import { getCoachNote, getDashboardData, getLatestLyftaWorkout } from '@/lib/app.functions'
import type { LyftaWorkout } from '@/lib/lyfta'
import type { DailyCheckin } from '@/lib/types'

export const Route = createFileRoute('/_app/')({
  loader: async () => {
    const [dashboard, coachNote] = await Promise.all([getDashboardData(), getCoachNote()])
    return { ...dashboard, coachNote }
  },
  component: Dashboard,
})

const delay = (d: number) => ({ '--d': d }) as CSSProperties

function percent(value: number | null | undefined, goal: number) {
  return value && goal > 0 ? Math.min((value / goal) * 100, 100) : 0
}

function greetingFor(hour: number) {
  if (hour < 5) return 'Up late'
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

function Dashboard() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { openCheckin } = useDailyCheckinDialog()
  const [checkin, setCheckin] = useState(data.checkin)
  const [workout, setWorkout] = useState<LyftaWorkout | null>(null)
  const [greeting, setGreeting] = useState('Hey')
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

  const calories = checkin?.calories ?? 0
  const protein = checkin?.protein_grams ?? 0
  const caloriePercent = percent(calories, calorieGoal)
  const proteinPercent = percent(protein, proteinGoal)
  const hill = Math.round((caloriePercent + proteinPercent) / 2)
  const caloriesLeft = calorieGoal - calories
  const proteinLeft = Math.max(proteinGoal - protein, 0)
  const weightDelta = data.weightTrend.length >= 2 ? data.weightTrend[0].weight_kg - data.weightTrend[data.weightTrend.length - 1].weight_kg : null
  const checkedInToday = checkin?.date === todayIso && checkin.weight_kg !== null

  async function saveWeight(value: number) {
    const response = await fetch('/api/checkins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: todayIso, weight_kg: value }),
    })
    const result = await response.json() as { data?: DailyCheckin; error?: { message?: string } }
    if (!response.ok || !result.data) throw new Error(result.error?.message || 'Could not save weight')
    setCheckin(result.data)
    await router.invalidate()
  }

  useEffect(() => {
    setCheckin(data.checkin)
  }, [data.checkin])

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()))
    let current = true
    getLatestLyftaWorkout().then((latest) => current && setWorkout(latest)).catch(() => undefined)
    return () => {
      current = false
    }
  }, [])

  return (
    <Page className="pt-0 sm:pt-0 lg:pt-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="space-y-5">
          <section className="relative -mx-4 h-[22rem] overflow-hidden rounded-b-[2.25rem] sm:-mx-6 lg:mx-0 lg:rounded-[2.25rem]">
            <SunriseScene progress={hill / 100} className="absolute inset-0" />
            <div className="rise relative px-5 pt-8 sm:px-7">
              <p className="text-sm font-bold text-[#ffb38a]">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })}</p>
              <h1 className="mt-1 text-[2.1rem] leading-[1.02] font-extrabold tracking-tight text-cream">{greeting}, Sian.<br /><CountUp value={hill} />% up the hill.</h1>
              <p className="mt-1.5 text-sm font-semibold text-cream/70">Calories + protein vs your goals</p>
            </div>
            {data.streak > 0 && (
              <div className="pop absolute right-4 bottom-8 flex items-center gap-1.5 rounded-full bg-cream px-3.5 py-2 text-sm font-extrabold text-[#1d1330] shadow-[0_10px_24px_-8px_rgb(0_0_0/.6)]" style={delay(8)}>
                <Flame className="anim-flicker size-4 fill-sun text-sun" /> {data.streak} day streak
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MacroCard label="Calories" value={calories} goal={calorieGoal} unit="" tone="sun" percentValue={caloriePercent} style={delay(1)}
              footer={caloriesLeft >= 0 ? <><b className="text-cream">{caloriesLeft.toLocaleString()} kcal</b> left today</> : <><b className="text-rose">{Math.abs(caloriesLeft).toLocaleString()} kcal</b> over goal</>} />
            <MacroCard label="Protein" value={protein} goal={proteinGoal} unit="g" tone="mint" percentValue={proteinPercent} style={delay(2)}
              footer={proteinLeft > 0 ? <><b className="text-cream">{proteinLeft}g</b> to go</> : <b className="text-mint">Goal smashed</b>} />
          </div>

          <button type="button" onClick={() => openCheckin()} className="rise flex w-full items-center gap-4 rounded-[1.8rem] border border-white/8 bg-card p-4 text-left transition-colors hover:bg-dusk-high" style={delay(3)}>
            <Doodle kind={checkedInToday ? 'check' : 'plate'} className="size-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-cream">{checkedInToday ? 'Checked in today' : 'Daily check-in'}</p>
              <p className="truncate text-sm font-semibold text-muted-foreground">{checkedInToday ? `${checkin?.weight_kg} kg logged. Tap to edit.` : 'Weight and meals for today.'}</p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/8 text-cream"><Pencil className="size-4" /></span>
          </button>

          <section className="rise space-y-3" style={delay(4)}>
            <SectionTitle title="This week" meta={`${data.weeklyCheckins.length} of 7 days`} />
            <div className="grid grid-cols-7 gap-1 rounded-[1.8rem] border border-white/8 bg-card px-2 py-4">
              {weekDays.map((day, index) => {
                const state = completedDays.has(day.date) ? 'done' : day.date === todayIso ? 'today' : 'idle'
                return (
                  <div key={day.date} className={`pop grid justify-items-center gap-1.5 text-xs font-bold ${day.date === todayIso ? 'text-sun' : state === 'done' ? 'text-cream' : 'text-muted-foreground'}`} style={delay(index + 4)}>
                    <DaySun state={state} />
                    {day.label}
                    <span className="sr-only">{state === 'done' ? 'checked in' : 'no check-in'}</span>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <div className="space-y-5 lg:pt-0">
          <section className="space-y-3">
            <SectionTitle title="Body today" meta="Check-in" className="rise" style={delay(5)} />
            <ToneTile tone="sun" label="Weight" className="rise" style={delay(5)} doodle={<Doodle kind="scale" />}
              value={<EditableNumber value={checkin?.weight_kg ?? null} unit="kg" max={500} step={0.1} decimals={1} ariaLabel="Weight in kilograms" onSave={saveWeight} />}
              footer={weightDelta !== null ? `${weightDelta <= 0 ? '▼' : '▲'} ${Math.abs(weightDelta).toFixed(1)} kg trend` : 'Tap the weight to log it'} />
          </section>

          {workout && <LyftaSessionCard workout={workout} className="rise" />}

          {data.coachNote && (
            <section className="rise relative overflow-hidden rounded-[1.8rem] border border-lilac/20 bg-[linear-gradient(160deg,rgb(167_139_250/.16),rgb(167_139_250/.03))] p-5" style={delay(9)}>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-lilac/20"><svg viewBox="0 0 24 24" className="anim-spin-slow size-6" style={{ animationDuration: '14s' }} aria-hidden="true"><g stroke="#ffd23f" strokeWidth="2" strokeLinecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></g><circle cx="12" cy="12" r="4.5" fill="#ff9447" /></svg></span>
                <p className="text-xs font-extrabold tracking-[0.14em] text-[#cfc0ff] uppercase">Last night's coach note</p>
              </div>
              <p className="mt-3 text-[0.95rem] leading-relaxed font-medium whitespace-pre-wrap text-cream/90">{data.coachNote}</p>
            </section>
          )}
        </div>
      </div>

      <NutritionEntryTracker date={todayIso} initialEntries={data.nutritionEntries} calorieGoal={calorieGoal} proteinGoal={proteinGoal} showTotals={false} onCheckinChange={async (nextCheckin) => {
        setCheckin(nextCheckin)
        await router.invalidate()
      }} />
    </Page>
  )
}

function MacroCard({ label, value, goal, unit, tone, percentValue, footer, style }: {
  label: string
  value: number
  goal: number
  unit: string
  tone: 'sun' | 'mint'
  percentValue: number
  footer: React.ReactNode
  style?: CSSProperties
}) {
  return (
    <div className="rise rounded-[1.8rem] border border-white/8 bg-card p-5" style={style}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-bold text-muted-foreground">{label}</p>
        <p className="text-[1.75rem] leading-none font-extrabold tracking-tight text-cream"><CountUp value={value} />{unit}<small className="ml-1 text-sm font-bold text-muted-foreground">/ {goal.toLocaleString()}{unit}</small></p>
      </div>
      <StripeBar value={percentValue} tone={tone} className="mt-3" />
      <p className="mt-2.5 text-sm font-semibold text-muted-foreground">{footer}</p>
    </div>
  )
}
