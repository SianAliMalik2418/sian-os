import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CalendarDays, Droplets, Dumbbell, RefreshCw, Scale, Sparkles } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getWeeklyReviewData } from '@/lib/app.functions'

export const Route = createFileRoute('/_app/weekly-review')({ loader: () => getWeeklyReviewData(), component: WeeklyReviewPage })

function currentMonday() {
  const date = new Date()
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - day + 1)
  return date.toISOString().slice(0, 10)
}

function WeeklyReviewPage() {
  const reviews = Route.useLoaderData()
  const router = useRouter()
  const [weekStart, setWeekStart] = useState(currentMonday())
  const current = reviews.find((review) => review.week_start === weekStart)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setStatus(undefined)
    const form = new FormData(event.currentTarget)
    const payload = { week_start: weekStart, missed_workouts: Number(form.get('missed_workouts') || 0), wins: String(form.get('wins') || ''), lessons: String(form.get('lessons') || ''), focus_next_week: String(form.get('focus_next_week') || '') }
    try {
      const response = await fetch('/api/weekly-reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not rebuild review')
      setStatus('Review rebuilt and saved.'); await router.invalidate()
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not rebuild review') } finally { setSaving(false) }
  }

  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Weekly reflection</p><h1 className="mt-2 font-heading text-3xl font-semibold">Turn logs into decisions.</h1><p className="mt-2 text-muted-foreground">Compute the week, capture the lesson, and choose the next focus.</p></div><label className="grid gap-1 text-xs text-muted-foreground">Week starting<Input nativeInput type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} /></label></header>
    {status && <p className="text-sm text-primary">{status}</p>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={Dumbbell} label="Workouts completed" value={String(current?.workouts_completed ?? '—')} />
      <Stat icon={Scale} label="Weight change" value={current?.body_weight_change === null || current?.body_weight_change === undefined ? '—' : `${Number(current.body_weight_change).toFixed(1)} kg`} />
      <Stat icon={Droplets} label="Water consistency" value={current?.water_consistency ? `${current.water_consistency}/10` : '—'} />
      <Stat icon={Sparkles} label="Recovery quality" value={current?.recovery_quality ? `${current.recovery_quality}/10` : '—'} />
    </section>

    <form key={`${weekStart}-${String(current?.created_at)}`} onSubmit={submit}>
      <Card><CardHeader><CardTitle>Review this week</CardTitle><CardDescription>Computed fields refresh from D1 whenever you save</CardDescription><CardAction><Badge variant={current ? 'success' : 'secondary'}>{current ? 'Saved' : 'Not reviewed'}</Badge></CardAction></CardHeader><CardPanel className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2"><span className="text-sm font-medium">Missed planned workouts</span><Input nativeInput name="missed_workouts" type="number" min="0" defaultValue={String(current?.missed_workouts ?? 0)} /></label>
        <div className="rounded-xl bg-secondary p-4"><p className="text-sm font-medium">Best workout</p><p className="mt-2 text-sm text-muted-foreground">{String(current?.best_workout || 'Calculated after the review is built')}</p></div>
        <label className="grid gap-2"><span className="text-sm font-medium">Wins</span><Textarea name="wins" defaultValue={String(current?.wins || '')} rows={4} placeholder="What moved forward?" /></label>
        <label className="grid gap-2"><span className="text-sm font-medium">Lessons learned</span><Textarea name="lessons" defaultValue={String(current?.lessons || '')} rows={4} placeholder="What should change?" /></label>
        <label className="grid gap-2 lg:col-span-2"><span className="text-sm font-medium">Focus next week</span><Textarea name="focus_next_week" defaultValue={String(current?.focus_next_week || '')} rows={3} placeholder="One clear priority…" /></label>
        <div className="flex justify-end lg:col-span-2"><Button type="submit" size="lg" loading={saving}><RefreshCw /> Build and save review</Button></div>
      </CardPanel></Card>
    </form>

    <Card><CardHeader><CardTitle>Review history</CardTitle><CardDescription>Permanent weekly snapshots</CardDescription><CardAction><CalendarDays className="size-5 text-primary" /></CardAction></CardHeader><CardPanel className="space-y-3">{reviews.length ? reviews.map((review) => <button type="button" key={String(review.id)} onClick={() => setWeekStart(String(review.week_start))} className="flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition hover:bg-accent sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Week of {String(review.week_start)}</p><p className="mt-1 text-sm text-muted-foreground">{String(review.wins || review.focus_next_week || 'Review saved')}</p></div><div className="flex gap-2"><Badge variant="outline">{String(review.workouts_completed)} workouts</Badge>{review.recovery_quality && <Badge variant="secondary">Recovery {String(review.recovery_quality)}</Badge>}</div></button>) : <p className="py-10 text-center text-sm text-muted-foreground">Build your first weekly review above.</p>}</CardPanel></Card>
  </div>
}

function Stat({ icon: Icon, label, value }: { icon: typeof Dumbbell; label: string; value: string }) { return <Card><CardHeader><Icon className="mb-2 size-5 text-primary" /><CardDescription>{label}</CardDescription><CardTitle className="text-2xl tabular-nums">{value}</CardTitle></CardHeader></Card> }
