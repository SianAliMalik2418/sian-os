import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Activity, Check, Droplets, Moon, Scale, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDailyCheckinDialog } from '@/components/daily-checkin-dialog'
import { NutritionEntryTracker } from '@/components/nutrition-entry-tracker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getDashboardData } from '@/lib/app.functions'

export const Route = createFileRoute('/_app/')({
  loader: () => getDashboardData(),
  component: Dashboard,
})

function formatValue(value: number | null | undefined, suffix = '') {
  return value === null || value === undefined ? '—' : `${value}${suffix}`
}

function Dashboard() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { openCheckin } = useDailyCheckinDialog()
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

  const metrics = [
    { label: 'Weight', value: formatValue(checkin?.weight_kg, ' kg'), icon: Scale },
    { label: 'Water', value: formatValue(checkin?.water_liters, ' L'), icon: Droplets },
    { label: 'Sleep', value: formatValue(checkin?.sleep_hours, ' hrs'), icon: Moon },
  ]

  useEffect(() => {
    setCheckin(data.checkin)
  }, [data.checkin])

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Today</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Build the next strong day.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Keep the signal clean: check in, nourish yourself, and recover deliberately.</p>
        </div>
        <Button type="button" size="lg" onClick={() => openCheckin()} className="min-h-11 rounded-xl">
          <Activity className="size-4" /> {checkin?.date === new Date().toISOString().slice(0, 10) ? 'Edit today' : 'Check in'}
        </Button>
      </header>

      <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_45%)]">
        <CardHeader>
          <div className="flex items-center gap-3"><span className="rounded-xl bg-primary p-2 text-primary-foreground"><Sparkles className="size-5" /></span><div><CardTitle>Consistency pulse</CardTitle><CardDescription>Your current daily check-in rhythm</CardDescription></div></div>
          <CardAction><Badge variant={data.streak > 0 ? 'success' : 'secondary'}>{data.streak} day streak</Badge></CardAction>
        </CardHeader>
        <CardPanel>
          <div className="mb-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">This week</span><span>{data.weeklyCheckins.length}/7 complete</span></div>
          <Progress value={(data.weeklyCheckins.length / 7) * 100} />
          <div className="mt-4 grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const isCompleted = completedDays.has(day.date)
              return (
                <div key={day.date} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-center text-xs ${isCompleted ? 'border-primary/40 bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                  {isCompleted && <><Check className="size-4 stroke-[2.5]" aria-hidden="true" /><span className="sr-only">Completed</span></>}
                  <span>{day.label}</span>
                </div>
              )
            })}
          </div>
        </CardPanel>
      </Card>

      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}><CardHeader><CardDescription>{label}</CardDescription><CardAction><Icon className="size-5 text-primary" /></CardAction><CardTitle className="text-2xl">{value}</CardTitle></CardHeader></Card>
        ))}
      </section>

      <NutritionEntryTracker date={todayIso} initialEntries={data.nutritionEntries} calorieGoal={calorieGoal} proteinGoal={proteinGoal} onCheckinChange={async (nextCheckin) => {
        setCheckin(nextCheckin)
        await router.invalidate()
      }} />
    </div>
  )
}
