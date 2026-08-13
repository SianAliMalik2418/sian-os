import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CalendarRange, CheckCircle2, Droplets, Flame, Moon, Pencil, Scale, Trash2, Utensils } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDailyCheckinDialog } from '@/components/daily-checkin-dialog'
import { Area, Line } from '@/components/dither-kit/area'
import { AreaChart, LineChart } from '@/components/dither-kit/area-chart'
import { Bar } from '@/components/dither-kit/bar'
import { BarChart } from '@/components/dither-kit/bar-chart'
import { Grid } from '@/components/dither-kit/grid'
import { Tooltip } from '@/components/dither-kit/tooltip'
import { XAxis } from '@/components/dither-kit/x-axis'
import { YAxis } from '@/components/dither-kit/y-axis'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '@/components/ui/dialog'
import { getReportsData } from '@/lib/app.functions'
import { aggregateReports, reportAverages, type DailyReportPoint } from '@/lib/reports'

export const Route = createFileRoute('/_app/reports')({ loader: () => getReportsData(), component: ReportsPage })

type Interval = 'daily' | 'weekly' | 'monthly'
type MetricKey = 'weight_kg' | 'sleep_hours' | 'water_liters' | 'protein_grams' | 'calories'

const today = () => new Date().toISOString().slice(0, 10)

function daysAgo(days: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

function formatPeriod(period: string, interval: Interval) {
  const date = new Date(`${period}T00:00:00.000Z`)
  if (interval === 'monthly') return date.toLocaleDateString('en', { month: 'short', year: '2-digit', timeZone: 'UTC' })
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function formatMetric(value: number | null, suffix: string) {
  return value === null ? '—' : `${Number(value.toFixed(1))}${suffix}`
}

function ReportsPage() {
  const allDaily = Route.useLoaderData()
  const router = useRouter()
  const { openCheckin } = useDailyCheckinDialog()
  const [from, setFrom] = useState(daysAgo(89))
  const [to, setTo] = useState(today())
  const [interval, setInterval] = useState<Interval>('daily')
  const [preset, setPreset] = useState('90d')
  const [deleteDate, setDeleteDate] = useState<string>()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string>()

  const filteredDaily = useMemo(
    () => allDaily.filter((point) => point.period >= from && point.period <= to),
    [allDaily, from, to],
  )
  const points = useMemo(
    () => interval === 'daily' ? filteredDaily : aggregateReports(filteredDaily, interval),
    [filteredDaily, interval],
  )
  const chartPoints = useMemo(
    () => points.map((point) => ({ ...point, label: formatPeriod(point.period, interval) })),
    [points, interval],
  )
  const summary = useMemo(() => reportAverages(filteredDaily), [filteredDaily])

  function applyPreset(value: string, days?: number) {
    setPreset(value)
    setTo(today())
    setFrom(days === undefined ? (allDaily[0]?.period ?? today()) : daysAgo(days - 1))
  }

  function changeFrom(value: string) {
    setPreset('custom')
    setFrom(value)
    if (value > to) setTo(value)
  }

  function changeTo(value: string) {
    setPreset('custom')
    setTo(value)
    if (value < from) setFrom(value)
  }

  async function deleteCheckin() {
    if (!deleteDate) return
    setDeleting(true)
    setError(undefined)
    try {
      const response = await fetch(`/api/checkins?date=${encodeURIComponent(deleteDate)}`, { method: 'DELETE' })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not delete check-in')
      setDeleteDate(undefined)
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete check-in')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Reports</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">See the pattern, not the noise.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Explore daily detail, weekly averages, and monthly direction across your wellness data.</p>
      </header>

      <Card>
        <CardHeader>
          <div><CardTitle>Date range</CardTitle><CardDescription>Choose a preset or set an exact reporting window</CardDescription></div>
          <CardAction><CalendarRange className="size-5 text-primary" /></CardAction>
        </CardHeader>
        <CardPanel className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              ['7d', '7 days', 7],
              ['30d', '30 days', 30],
              ['90d', '90 days', 90],
              ['1y', '1 year', 365],
            ].map(([value, label, days]) => (
              <Button key={String(value)} type="button" size="sm" variant={preset === value ? 'default' : 'outline'} onClick={() => applyPreset(String(value), Number(days))}>{String(label)}</Button>
            ))}
            <Button type="button" size="sm" variant={preset === 'all' ? 'default' : 'outline'} onClick={() => applyPreset('all')}>All time</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <RangeField label="From"><DatePicker value={from} onValueChange={changeFrom} required /></RangeField>
            <RangeField label="To"><DatePicker value={to} onValueChange={changeTo} required /></RangeField>
          </div>
        </CardPanel>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard icon={CheckCircle2} label="Check-ins" value={String(summary.checkins)} />
        <SummaryCard icon={Scale} label="Average weight" value={formatMetric(summary.weight_kg, ' kg')} />
        <SummaryCard icon={Moon} label="Average sleep" value={formatMetric(summary.sleep_hours, ' hrs')} />
        <SummaryCard icon={Droplets} label="Average water" value={formatMetric(summary.water_liters, ' L')} />
        <SummaryCard icon={Utensils} label="Average protein" value={formatMetric(summary.protein_grams, ' g')} />
        <SummaryCard icon={Flame} label="Average calories" value={formatMetric(summary.calories, ' kcal')} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="font-heading text-2xl font-semibold">Trends</h2><p className="text-sm text-muted-foreground">Values are averaged within weekly and monthly views.</p></div>
          <div className="grid grid-cols-3 rounded-xl border bg-secondary/40 p-1" aria-label="Report interval">
            {(['daily', 'weekly', 'monthly'] as const).map((value) => <Button key={value} type="button" size="sm" variant={interval === value ? 'default' : 'ghost'} onClick={() => setInterval(value)} className="capitalize">{value}</Button>)}
          </div>
        </div>

        {chartPoints.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <MetricChart title="Body weight" description="Weight direction across the selected period" icon={Scale} data={chartPoints} dataKey="weight_kg" color="green" suffix=" kg" kind="area" />
            <MetricChart title="Sleep duration" description="Logged sleep hours" icon={Moon} data={chartPoints} dataKey="sleep_hours" color="purple" suffix=" hrs" kind="line" />
            <MetricChart title="Hydration" description="Average recorded water intake" icon={Droplets} data={chartPoints} dataKey="water_liters" color="blue" suffix=" L" kind="bar" />
            <MetricChart title="Protein" description="Average recorded daily protein" icon={Utensils} data={chartPoints} dataKey="protein_grams" color="orange" suffix=" g" kind="bar" />
            <MetricChart title="Calories" description="Average estimated daily intake" icon={Flame} data={chartPoints} dataKey="calories" color="red" suffix=" kcal" kind="bar" />
          </div>
        ) : (
          <Card><CardPanel className="py-16 text-center"><CalendarRange className="mx-auto mb-3 size-8 text-muted-foreground" /><p className="font-medium">No report data in this range</p><p className="mt-1 text-sm text-muted-foreground">Choose a wider range or add daily wellness data.</p></CardPanel></Card>
        )}
      </section>

      {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}

      <Card>
        <CardHeader><div><CardTitle>{interval[0].toUpperCase() + interval.slice(1)} report</CardTitle><CardDescription>{interval === 'daily' ? 'Review, edit, or delete each daily check-in' : 'Detailed averages for the selected range'}</CardDescription></div></CardHeader>
        <CardPanel className="overflow-x-auto p-0">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="border-b bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Period</th><th className="px-4 py-3">Check-ins</th><th className="px-4 py-3">Weight</th><th className="px-4 py-3">Sleep</th><th className="px-4 py-3">Water</th><th className="px-4 py-3">Protein</th><th className="px-4 py-3">Calories</th>{interval === 'daily' && <th className="px-4 py-3 text-right">Actions</th>}</tr></thead>
            <tbody>{points.map((point) => <tr key={point.period} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{formatPeriod(point.period, interval)}</td><td className="px-4 py-3 tabular-nums">{point.checkins}</td><td className="px-4 py-3 tabular-nums">{formatMetric(point.weight_kg, ' kg')}</td><td className="px-4 py-3 tabular-nums">{formatMetric(point.sleep_hours, ' hrs')}</td><td className="px-4 py-3 tabular-nums">{formatMetric(point.water_liters, ' L')}</td><td className="px-4 py-3 tabular-nums">{formatMetric(point.protein_grams, ' g')}</td><td className="px-4 py-3 tabular-nums">{formatMetric(point.calories, ' kcal')}</td>{interval === 'daily' && <td className="px-4 py-2"><div className="flex justify-end gap-1"><Button type="button" size="icon-sm" variant="ghost" onClick={() => openCheckin(point.period)} aria-label={`Edit check-in for ${point.period}`}><Pencil /></Button><Button type="button" size="icon-sm" variant="ghost" onClick={() => setDeleteDate(point.period)} aria-label={`Delete check-in for ${point.period}`} className="text-destructive"><Trash2 /></Button></div></td>}</tr>)}</tbody>
          </table>
          {!points.length && <p className="py-10 text-center text-sm text-muted-foreground">No rows to display.</p>}
        </CardPanel>
      </Card>

      <Dialog open={Boolean(deleteDate)} onOpenChange={(open) => !open && setDeleteDate(undefined)}>
        <DialogPopup className="max-w-md">
          <DialogHeader><DialogTitle>Delete daily check-in?</DialogTitle><DialogDescription>This permanently removes the check-in for {deleteDate}. Progress photos for that date are kept.</DialogDescription></DialogHeader>
          <DialogPanel><p className="text-sm text-muted-foreground">This action cannot be undone.</p></DialogPanel>
          <DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button type="button" variant="destructive" loading={deleting} onClick={deleteCheckin}><Trash2 /> Delete check-in</Button></DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}

function RangeField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label>
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Scale; label: string; value: string }) {
  return <Card><CardHeader><CardDescription>{label}</CardDescription><CardAction><Icon className="size-5 text-primary" /></CardAction><CardTitle className="text-xl tabular-nums sm:text-2xl">{value}</CardTitle></CardHeader></Card>
}

function MetricChart({ title, description, icon: Icon, data, dataKey, color, suffix, kind }: {
  title: string
  description: string
  icon: typeof Scale
  data: Array<DailyReportPoint & { label: string }>
  dataKey: MetricKey
  color: 'green' | 'purple' | 'blue' | 'orange' | 'red'
  suffix: string
  kind: 'area' | 'line' | 'bar'
}) {
  const present = data.filter((point) => point[dataKey] !== null)
  const config = { [dataKey]: { label: title, color } }
  const formatter = (value: number) => `${Number(value.toFixed(1))}${suffix}`

  return <Card><CardHeader><div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div><CardAction><Icon className="size-5 text-primary" /></CardAction></CardHeader><CardPanel>
    {present.length ? <div className="h-64 sm:h-72">
      {kind === 'area' && <AreaChart data={present} config={config} bloom="aura"><Grid /><XAxis dataKey="label" maxTicks={6} /><YAxis tickFormatter={formatter} /><Tooltip labelKey="label" valueFormatter={formatter} /><Area dataKey={dataKey} variant="gradient" /></AreaChart>}
      {kind === 'line' && <LineChart data={present} config={config} bloom="aura"><Grid /><XAxis dataKey="label" maxTicks={6} /><YAxis tickFormatter={formatter} /><Tooltip labelKey="label" valueFormatter={formatter} /><Line dataKey={dataKey} /></LineChart>}
      {kind === 'bar' && <BarChart data={present} config={config} bloom="aura"><Grid /><XAxis dataKey="label" maxTicks={6} /><YAxis tickFormatter={formatter} /><Tooltip labelKey="label" valueFormatter={formatter} /><Bar dataKey={dataKey} variant="hatched" /></BarChart>}
    </div> : <div className="grid h-64 place-items-center text-sm text-muted-foreground">No {title.toLowerCase()} data in this range.</div>}
  </CardPanel></Card>
}
