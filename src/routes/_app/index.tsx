import { Link, createFileRoute } from '@tanstack/react-router'
import { Activity, ArrowRight, Droplets, Dumbbell, Flame, Scale, Sparkles, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
  const checkin = data.checkin
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
    { label: 'Recovery', value: formatValue(checkin?.recovery, '/10'), icon: Flame },
    { label: 'Workouts this week', value: String(data.weeklyWorkoutCount), icon: Dumbbell },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Today</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Build the next strong day.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Keep the signal clean: check in, train with intent, and recover deliberately.</p>
        </div>
        <Link to="/check-in" className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          <Activity className="size-4" /> {checkin?.date === new Date().toISOString().slice(0, 10) ? 'Edit today' : 'Check in'}
        </Link>
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
            {weekDays.map((day) => <div key={day.date} className={`rounded-lg border px-1 py-2 text-center text-xs ${completedDays.has(day.date) ? 'border-primary/40 bg-primary/10 text-primary' : 'text-muted-foreground'}`}>{day.label}</div>)}
          </div>
        </CardPanel>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}><CardHeader><CardDescription>{label}</CardDescription><CardAction><Icon className="size-5 text-primary" /></CardAction><CardTitle className="text-2xl">{value}</CardTitle></CardHeader></Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Recent workouts</CardTitle><CardDescription>Your latest training sessions</CardDescription><CardAction><Link to="/workouts" className="text-sm text-primary">View all</Link></CardAction></CardHeader>
          <CardPanel className="space-y-2">
            {data.workouts.length ? data.workouts.map((workout) => (
              <Link key={workout.id} to="/workouts" className="flex items-center justify-between rounded-xl border p-3 transition hover:bg-accent">
                <div><p className="font-medium">{workout.title}</p><p className="text-sm text-muted-foreground">{workout.date}{workout.program ? ` · ${workout.program}` : ''}</p></div><ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            )) : <EmptyMessage title="No workouts yet" body="Log your first session and build a permanent training history." to="/workouts" action="Log workout" />}
          </CardPanel>
        </Card>

        <Card>
          <CardHeader><CardTitle>Strength records</CardTitle><CardDescription>Best estimated performance by exercise</CardDescription><CardAction><Trophy className="size-5 text-primary" /></CardAction></CardHeader>
          <CardPanel className="space-y-3">
            {data.prs.length ? data.prs.map((record, index) => (
              <div key={record.name} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"><div className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-secondary text-xs">{index + 1}</span><span className="font-medium">{record.name}</span></div><span className="text-sm tabular-nums text-muted-foreground">{record.estimated_1rm ? `${Math.round(record.estimated_1rm)} kg e1RM` : '—'}</span></div>
            )) : <p className="py-8 text-center text-sm text-muted-foreground">Records appear after you log weighted sets.</p>}
          </CardPanel>
        </Card>
      </section>
    </div>
  )
}

function EmptyMessage({ title, body, to, action }: { title: string; body: string; to: '/workouts'; action: string }) {
  return <div className="rounded-xl border border-dashed p-6 text-center"><Dumbbell className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="font-medium">{title}</p><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p><Link to={to} className="mt-4 inline-flex text-sm font-medium text-primary">{action}</Link></div>
}
