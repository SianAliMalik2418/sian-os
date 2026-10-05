import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Flame, Footprints, Pencil, Scale, Trash2, Utensils } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState, type CSSProperties } from 'react'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { useDailyCheckinDialog } from '@/components/daily-checkin-dialog'
import { Area, Line } from '@/components/dither-kit/area'
import { AreaChart, LineChart } from '@/components/dither-kit/area-chart'
import { Bar } from '@/components/dither-kit/bar'
import { BarChart } from '@/components/dither-kit/bar-chart'
import { Grid } from '@/components/dither-kit/grid'
import { Tooltip } from '@/components/dither-kit/tooltip'
import { XAxis } from '@/components/dither-kit/x-axis'
import { YAxis } from '@/components/dither-kit/y-axis'
import { Doodle } from '@/components/sunrise/illustrations'
import { CountUp, Notice, Page, PageHeader, SectionTitle, ToneTile, Unit, type Tone } from '@/components/sunrise/primitives'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { getReportsData } from '@/lib/app.functions'
import { aggregateReports, reportAverages, type DailyReportPoint } from '@/lib/reports'

export const Route = createFileRoute('/_app/reports')({ loader: () => getReportsData(), component: ReportsPage })

type Interval = 'daily' | 'weekly' | 'monthly'
type MetricKey = 'weight_kg' | 'protein_grams' | 'calories' | 'steps' | 'active_calories'

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
  const [from, setFrom] = useState(daysAgo(6))
  const [to, setTo] = useState(today())
  const [interval, setInterval] = useState<Interval>('daily')
  const [preset, setPreset] = useState('7d')
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

  const rangeLabel = `${formatPeriod(from, 'daily')} – ${formatPeriod(to, 'daily')}`

  return (
    <Page>
      <PageHeader kicker="Reports" title="See the pattern." description="Daily detail, weekly averages, monthly direction." illustration="reports" />

      <section className="rise space-y-4 rounded-[1.8rem] border border-white/8 bg-card p-4 sm:p-5" style={{ '--d': 1 } as CSSProperties}>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {([['7d', '7 days', 7], ['30d', '30 days', 30], ['90d', '90 days', 90], ['1y', '1 year', 365], ['all', 'All time', undefined]] as const).map(([value, label, days]) => (
            <button key={value} type="button" onClick={() => applyPreset(value, days)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition-colors ${preset === value ? 'bg-sun text-[#1d1330]' : 'bg-white/7 text-muted-foreground hover:text-cream'}`}>{label}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RangeField label="From"><DatePicker value={from} onValueChange={changeFrom} required /></RangeField>
          <RangeField label="To"><DatePicker value={to} onValueChange={changeTo} required /></RangeField>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ToneTile tone="mint" label="Check-ins" className="rise col-span-2 lg:col-span-1" style={{ '--d': 2 } as CSSProperties} doodle={<Doodle kind="check" />} value={summary.checkins} footer={rangeLabel} />
        <ToneTile tone="sun" label="Avg weight" className="rise" style={{ '--d': 3 } as CSSProperties} doodle={<Doodle kind="scale" />} value={<Metric value={summary.weight_kg} unit="kg" />} />
        <ToneTile tone="rose" label="Avg protein" className="rise" style={{ '--d': 4 } as CSSProperties} doodle={<Doodle kind="protein" />} value={<Metric value={summary.protein_grams} unit="g" />} />
        <ToneTile tone="butter" label="Avg calories" className="rise" style={{ '--d': 5 } as CSSProperties} doodle={<Doodle kind="flame" />} value={<Metric value={summary.calories} unit="kcal" whole />} />
        <ToneTile tone="mint" label="Avg steps" className="rise" style={{ '--d': 6 } as CSSProperties} doodle={<Doodle kind="steps" />} value={<Metric value={summary.steps} unit="" whole />} />
        <ToneTile tone="butter" label="Avg active" className="rise" style={{ '--d': 7 } as CSSProperties} value={<Metric value={summary.active_calories} unit="kcal" whole />} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle title="Trends" meta="Averaged per week or month" className="flex-1" />
          <IntervalSwitch value={interval} onChange={setInterval} />
        </div>

        {chartPoints.length ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <MetricChart title="Body weight" description="Direction across the range" icon={Scale} tone="sun" data={chartPoints} dataKey="weight_kg" color="orange" suffix=" kg" kind="area" />
            <MetricChart title="Protein" description="Recorded daily protein" icon={Utensils} tone="rose" data={chartPoints} dataKey="protein_grams" color="pink" suffix=" g" kind="bar" />
            <MetricChart title="Calories" description="Estimated daily intake" icon={Flame} tone="butter" data={chartPoints} dataKey="calories" color="red" suffix=" kcal" kind="bar" />
            <MetricChart title="Steps" description="From wearable sync" icon={Footprints} tone="mint" data={chartPoints} dataKey="steps" color="green" suffix="" kind="bar" />
            <MetricChart title="Active calories" description="Burned moving, from wearable sync" icon={Flame} tone="butter" data={chartPoints} dataKey="active_calories" color="orange" suffix=" kcal" kind="bar" />
          </div>
        ) : (
          <EmptyRange />
        )}
      </section>

      {error && <Notice tone="error">{error}</Notice>}

      <section className="space-y-3">
        <SectionTitle title={`${interval[0].toUpperCase() + interval.slice(1)} log`} meta={`${points.length} ${interval === 'daily' ? 'days' : interval === 'weekly' ? 'weeks' : 'months'}`} />

        <div className="grid gap-2.5 lg:hidden">
          {[...points].reverse().map((point) => (
            <article key={point.period} className="rounded-[1.5rem] border border-white/8 bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-extrabold text-cream">{formatPeriod(point.period, interval)}</p>{interval !== 'daily' && <p className="text-xs font-semibold text-muted-foreground">{point.checkins} check-ins</p>}</div>
                {interval === 'daily' && <div className="flex gap-1"><Button type="button" size="icon-sm" variant="ghost" onClick={() => openCheckin(point.period)} aria-label={`Edit check-in for ${point.period}`}><Pencil /></Button><Button type="button" size="icon-sm" variant="ghost" onClick={() => setDeleteDate(point.period)} aria-label={`Delete check-in for ${point.period}`} className="text-destructive-foreground"><Trash2 /></Button></div>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <LogChip tone="text-sun" value={formatMetric(point.weight_kg, ' kg')} label="weight" />
                <LogChip tone="text-rose" value={formatMetric(point.protein_grams, 'g')} label="protein" />
                <LogChip tone="text-butter" value={formatMetric(point.calories, '')} label="kcal" />
                <LogChip tone="text-mint" value={formatMetric(point.steps, '')} label="steps" />
                <LogChip tone="text-butter" value={formatMetric(point.active_calories, '')} label="active" />
              </div>
            </article>
          ))}
          {!points.length && <p className="rounded-[1.5rem] border border-dashed border-white/12 py-10 text-center text-sm font-semibold text-muted-foreground">No rows in this range.</p>}
        </div>

        <div className="hidden overflow-hidden rounded-[1.8rem] border border-white/8 bg-card lg:block">
          <table className="w-full text-sm">
            <thead className="border-b border-white/8 text-left text-xs font-extrabold tracking-wide text-muted-foreground uppercase"><tr><th className="px-5 py-4">Period</th><th className="px-4 py-4">Check-ins</th><th className="px-4 py-4">Weight</th><th className="px-4 py-4">Protein</th><th className="px-4 py-4">Calories</th><th className="px-4 py-4">Steps</th><th className="px-4 py-4">Active cal</th>{interval === 'daily' && <th className="px-5 py-4 text-right">Actions</th>}</tr></thead>
            <tbody>{points.map((point) => <tr key={point.period} className="border-b border-white/6 font-semibold last:border-0 hover:bg-white/3"><td className="px-5 py-3.5 font-extrabold text-cream">{formatPeriod(point.period, interval)}</td><td className="px-4 py-3.5 tabular-nums">{point.checkins}</td><td className="px-4 py-3.5 tabular-nums">{formatMetric(point.weight_kg, ' kg')}</td><td className="px-4 py-3.5 tabular-nums">{formatMetric(point.protein_grams, ' g')}</td><td className="px-4 py-3.5 tabular-nums">{formatMetric(point.calories, ' kcal')}</td><td className="px-4 py-3.5 tabular-nums">{formatMetric(point.steps, '')}</td><td className="px-4 py-3.5 tabular-nums">{formatMetric(point.active_calories, ' kcal')}</td>{interval === 'daily' && <td className="px-5 py-2"><div className="flex justify-end gap-1"><Button type="button" size="icon-sm" variant="ghost" onClick={() => openCheckin(point.period)} aria-label={`Edit check-in for ${point.period}`}><Pencil /></Button><Button type="button" size="icon-sm" variant="ghost" onClick={() => setDeleteDate(point.period)} aria-label={`Delete check-in for ${point.period}`} className="text-destructive-foreground"><Trash2 /></Button></div></td>}</tr>)}</tbody>
          </table>
          {!points.length && <p className="py-10 text-center text-sm font-semibold text-muted-foreground">No rows to display.</p>}
        </div>
      </section>

      <ConfirmDeleteDialog
        open={Boolean(deleteDate)}
        onOpenChange={(open) => !open && setDeleteDate(undefined)}
        title="Delete daily check-in?"
        description={`This permanently removes the check-in for ${deleteDate}. Progress photos for that date are kept.`}
        confirmLabel="Delete check-in"
        deleting={deleting}
        onConfirm={deleteCheckin}
      />
    </Page>
  )
}

function RangeField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="px-1 text-xs font-bold text-muted-foreground">{label}</span>{children}</label>
}

function Metric({ value, unit, whole = false }: { value: number | null; unit: string; whole?: boolean }) {
  if (value === null) return <>—</>
  const rounded = whole ? Math.round(value) : Number(value.toFixed(1))
  return <><CountUp value={rounded} decimals={Number.isInteger(rounded) ? 0 : 1} />{unit && <Unit>{unit}</Unit>}</>
}

function LogChip({ tone, value, label }: { tone: string; value: string; label: string }) {
  if (value === '—') return null
  return <span className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-semibold text-muted-foreground"><b className={`font-extrabold ${tone}`}>{value}</b> {label}</span>
}

function IntervalSwitch({ value, onChange }: { value: Interval; onChange: (value: Interval) => void }) {
  return (
    <div className="relative grid grid-cols-3 rounded-full border border-white/8 bg-card p-1" role="radiogroup" aria-label="Report interval">
      {(['daily', 'weekly', 'monthly'] as const).map((option) => (
        <button key={option} type="button" role="radio" aria-checked={value === option} onClick={() => onChange(option)} className={`relative rounded-full px-4 py-2 text-sm font-extrabold capitalize transition-colors ${value === option ? 'text-[#1d1330]' : 'text-muted-foreground hover:text-cream'}`}>
          {value === option && <motion.span layoutId="interval-pill" transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }} className="absolute inset-0 rounded-full bg-cream" />}
          <span className="relative">{option}</span>
        </button>
      ))}
    </div>
  )
}

function EmptyRange() {
  return (
    <div className="grid place-items-center gap-2 rounded-[1.8rem] border border-dashed border-white/12 px-6 py-14 text-center">
      <Doodle kind="moon" className="size-20" />
      <p className="text-lg font-extrabold text-cream">Quiet stretch</p>
      <p className="max-w-xs text-sm text-muted-foreground">No data in this range yet. Pick a wider window or log a few more days.</p>
    </div>
  )
}

const chartTone: Record<Tone, string> = { sun: 'bg-sun/15 text-sun', mint: 'bg-mint/15 text-mint', butter: 'bg-butter/15 text-butter', lilac: 'bg-lilac/15 text-lilac', rose: 'bg-rose/15 text-rose' }

function MetricChart({ title, description, icon: Icon, tone, data, dataKey, color, suffix, kind }: {
  title: string
  description: string
  icon: typeof Scale
  tone: Tone
  data: Array<DailyReportPoint & { label: string }>
  dataKey: MetricKey
  color: 'green' | 'purple' | 'blue' | 'orange' | 'pink' | 'red'
  suffix: string
  kind: 'area' | 'line' | 'bar'
}) {
  const present = data.filter((point) => point[dataKey] !== null)
  const config = { [dataKey]: { label: title, color } }
  const formatter = (value: number) => `${Number(value.toFixed(1))}${suffix}`
  const latest = present.at(-1)?.[dataKey]

  return (
    <article className="rise overflow-hidden rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,#201a3d,#161229)] p-4 sm:p-5">
      <header className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${chartTone[tone]}`}><Icon className="size-5" strokeWidth={2.4} /></span>
        <div className="min-w-0 flex-1"><h3 className="font-extrabold text-cream">{title}</h3><p className="truncate text-xs font-semibold text-muted-foreground">{description}</p></div>
        {typeof latest === 'number' && <p className="text-right text-lg font-extrabold text-cream tabular-nums">{formatter(latest)}<span className="block text-[0.65rem] font-bold text-muted-foreground uppercase">latest</span></p>}
      </header>
      {present.length ? <div className="mt-4 h-60 sm:h-72">
        {kind === 'area' && <AreaChart data={present} config={config} bloom="aura"><Grid /><XAxis dataKey="label" maxTicks={5} /><YAxis tickFormatter={formatter} /><Tooltip labelKey="label" valueFormatter={formatter} /><Area dataKey={dataKey} variant="gradient" /></AreaChart>}
        {kind === 'line' && <LineChart data={present} config={config} bloom="aura"><Grid /><XAxis dataKey="label" maxTicks={5} /><YAxis tickFormatter={formatter} /><Tooltip labelKey="label" valueFormatter={formatter} /><Line dataKey={dataKey} /></LineChart>}
        {kind === 'bar' && <BarChart data={present} config={config} bloom="aura"><Grid /><XAxis dataKey="label" maxTicks={5} /><YAxis tickFormatter={formatter} /><Tooltip labelKey="label" valueFormatter={formatter} /><Bar dataKey={dataKey} variant="hatched" /></BarChart>}
      </div> : <div className="mt-4 grid h-40 place-items-center rounded-2xl border border-dashed border-white/10 text-sm font-semibold text-muted-foreground">No {title.toLowerCase()} data in this range.</div>}
    </article>
  )
}
