import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Activity, Check, Droplets, Flame, Moon, Plus, Scale, Sparkles, Utensils } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useDailyCheckinDialog } from '@/components/daily-checkin-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { getDashboardData } from '@/lib/app.functions'
import type { CheckinInput } from '@/lib/schemas'
import type { DailyCheckin } from '@/lib/types'

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

  async function saveNutritionTotal(field: 'calories' | 'protein_grams', value: number) {
    const fresh = await fetch(`/api/checkins?date=${encodeURIComponent(todayIso)}`)
    const freshResult = await fresh.json() as { data?: DailyCheckin | null; error?: { message?: string } }
    if (!fresh.ok) throw new Error(freshResult.error?.message || 'Could not load today')

    const existing = freshResult.data
    const payload = buildCheckinPayload(existing, todayIso, { [field]: value })
    const response = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await response.json() as { data?: DailyCheckin; error?: { message?: string } }
    if (!response.ok || !result.data) throw new Error(result.error?.message || 'Could not save total')
    setCheckin(result.data)
    await router.invalidate()
  }

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

      <section className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        <NutritionProgressCard
          label="Calories"
          description="Running intake for today"
          value={checkin?.calories || 0}
          goal={calorieGoal}
          unit="kcal"
          icon={Flame}
          step={50}
          placeholder="250"
          onSave={(nextValue) => saveNutritionTotal('calories', nextValue)}
        />
        <NutritionProgressCard
          label="Protein"
          description="Running protein for today"
          value={checkin?.protein_grams || 0}
          goal={proteinGoal}
          unit="g"
          icon={Utensils}
          step={5}
          placeholder="25"
          onSave={(nextValue) => saveNutritionTotal('protein_grams', nextValue)}
        />
      </section>
    </div>
  )
}

function NutritionProgressCard({ label, description, value, goal, unit, icon: Icon, step, placeholder, onSave }: {
  label: string
  description: string
  value: number
  goal: number
  unit: string
  icon: typeof Flame
  step: number
  placeholder: string
  onSave: (nextValue: number) => Promise<void>
}) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const remaining = Math.max(goal - value, 0)
  const progress = goal > 0 ? Math.min((value / goal) * 100, 100) : 0

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a positive amount')
      return
    }

    setSaving(true)
    setError(undefined)
    try {
      await onSave(Math.round(value + parsed))
      setAmount('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{label}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <CardAction><Icon className="size-5 text-primary" /></CardAction>
      </CardHeader>
      <CardPanel className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div><p className="font-heading text-3xl font-semibold tabular-nums">{value}<span className="ml-1 text-base text-muted-foreground">{unit}</span></p><p className="mt-1 text-sm text-muted-foreground">{remaining} {unit} remaining</p></div>
          <Badge variant={remaining === 0 ? 'success' : 'info'}>{goal} {unit} goal</Badge>
        </div>
        <Progress value={progress} />
        <Form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field>
            <FieldLabel>Add {label.toLowerCase()}</FieldLabel>
            <Input nativeInput type="number" min="0" step={step} inputMode="numeric" placeholder={placeholder} value={amount} onChange={(event) => setAmount(event.target.value)} />
          </Field>
          <Button type="submit" loading={saving} className="self-end"><Plus /> Add</Button>
        </Form>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}
      </CardPanel>
    </Card>
  )
}

function buildCheckinPayload(existing: DailyCheckin | null | undefined, date: string, updates: Partial<Pick<CheckinInput, 'calories' | 'protein_grams'>>): CheckinInput {
  const payload: CheckinInput = { date }
  const fields = ['weight_kg', 'waist_inches', 'sleep_hours', 'water_liters', 'protein_grams', 'fat_grams', 'carb_grams', 'calories', 'nutrition_notes', 'workout_text', 'notes'] as const
  for (const field of fields) {
    const value = existing?.[field]
    if (value !== null && value !== undefined) Object.assign(payload, { [field]: value })
  }
  return { ...payload, ...updates }
}
