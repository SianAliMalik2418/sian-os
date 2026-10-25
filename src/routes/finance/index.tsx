import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, HandCoins } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Area } from '@/components/dither-kit/area'
import { AreaChart } from '@/components/dither-kit/area-chart'
import { Grid } from '@/components/dither-kit/grid'
import { Tooltip } from '@/components/dither-kit/tooltip'
import { XAxis } from '@/components/dither-kit/x-axis'
import { YAxis } from '@/components/dither-kit/y-axis'
import { DonutLegend, MoneyDivisionDonut, type DonutSlice } from '@/components/finance/money-division-donut'
import { CountUp, Notice, Page, PageHeader, SectionTitle, StripeBar, ToneTile, Unit } from '@/components/sunrise/primitives'
import { getFinanceDashboardData } from '@/lib/app.functions'
import { levelLabels } from '@/lib/finance-levels'

export const Route = createFileRoute('/finance/')({ loader: () => getFinanceDashboardData(), component: FinanceDashboard })

const BUCKET_COLORS = { family: '#ff6b2c', self: '#8b5cf6', service: '#2dd4bf' } as const
const BUCKET_LABELS = { family: 'Family', self: 'Self', service: 'Service' } as const

function money(value: number) {
  return `£${value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
}

function monthLabel(period: string) {
  return new Date(`${period}-01T00:00:00.000Z`).toLocaleDateString('en', { month: 'short', year: '2-digit', timeZone: 'UTC' })
}

function FinanceDashboard() {
  const { summary, debts } = Route.useLoaderData()
  const buckets: Array<keyof typeof BUCKET_COLORS> = ['family', 'self', 'service']
  const targetSlices: DonutSlice[] = buckets.map((key) => ({ key, label: BUCKET_LABELS[key], value: summary.target[key], color: BUCKET_COLORS[key] }))
  const actualSlices: DonutSlice[] = buckets.map((key) => ({ key, label: BUCKET_LABELS[key], value: summary.actual[key], color: BUCKET_COLORS[key] }))
  const emergencyTarget = summary.settings.emergency_fund_target
  const emergencyPercent = emergencyTarget && emergencyTarget > 0 ? Math.min((summary.settings.emergency_fund_balance / emergencyTarget) * 100, 100) : 0
  const outstandingDebts = debts.filter((debt) => debt.status === 'outstanding')
  const trend = summary.trend.map((point) => ({ ...point, label: monthLabel(point.period) }))
  const chartConfig = { income: { label: 'Income', color: 'green' as const }, expense: { label: 'Spending', color: 'red' as const } }

  return (
    <Page>
      <PageHeader kicker="Finance" title="Divide it with intention." description={`Level: ${levelLabels[summary.settings.level]}`} illustration="reports" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ToneTile tone="mint" label="This month's income" className="rise" style={{ '--d': 1 } as CSSProperties} value={<><CountUp value={summary.income} />{' '}<Unit>GBP</Unit></>} footer={`${summary.from} – ${summary.to}`} />
        <ToneTile tone="rose" label="This month's spending" className="rise" style={{ '--d': 2 } as CSSProperties} value={<><CountUp value={summary.expense} />{' '}<Unit>GBP</Unit></>} />
        <ToneTile tone="sun" label="Net" className="rise" style={{ '--d': 3 } as CSSProperties} value={<><CountUp value={summary.net} />{' '}<Unit>GBP</Unit></>} />
        <ToneTile tone="butter" label="Borrowed / lent" className="rise" style={{ '--d': 4 } as CSSProperties} value={<span className="text-xl">{money(summary.owedByMe)} <span className="text-muted-foreground">owed</span> · {money(summary.owedToMe)} <span className="text-muted-foreground">to me</span></span>} />
      </div>

      <section className="rise space-y-3 rounded-[1.8rem] border border-white/8 bg-card p-5" style={{ '--d': 5 } as CSSProperties}>
        <SectionTitle title="Emergency fund" meta={emergencyTarget ? `${money(summary.settings.emergency_fund_balance)} of ${money(emergencyTarget)}` : 'No target set'} />
        <StripeBar value={emergencyPercent} tone="mint" />
        {!emergencyTarget && <p className="text-sm text-muted-foreground">Set a target (3–6 months of expenses) in Settings before loosening up on non-essentials.</p>}
      </section>

      <section className="space-y-4">
        <SectionTitle title="Money division" meta="Target vs actual this month" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <article className="rise flex items-center gap-5 rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,#201a3d,#161229)] p-5">
            <MoneyDivisionDonut slices={targetSlices} centerLabel={<div><p className="text-xs font-bold text-muted-foreground">Target</p></div>} />
            <DonutLegend slices={targetSlices} formatter={money} />
          </article>
          <article className="rise flex items-center gap-5 rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,#201a3d,#161229)] p-5">
            <MoneyDivisionDonut slices={actualSlices} centerLabel={<div><p className="text-xs font-bold text-muted-foreground">Actual</p></div>} />
            <DonutLegend slices={actualSlices} formatter={money} />
          </article>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Trends" meta="Last 6 months" />
        {trend.length ? (
          <div className="rise h-64 rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,#201a3d,#161229)] p-4 sm:h-80 sm:p-5">
            <AreaChart data={trend} config={chartConfig} bloom="aura">
              <Grid /><XAxis dataKey="label" /><YAxis tickFormatter={money} /><Tooltip labelKey="label" valueFormatter={money} />
              <Area dataKey="income" variant="gradient" />
              <Area dataKey="expense" variant="dotted" />
            </AreaChart>
          </div>
        ) : (
          <Notice tone="status">No transactions yet — log income and spending to see trends.</Notice>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle title="Debts" meta={`${outstandingDebts.length} outstanding`} action={<Link to="/finance/debts" className="flex items-center gap-1 text-sun">View all <ArrowRight className="size-4" /></Link>} />
        {outstandingDebts.length ? (
          <div className="grid gap-2.5">
            {outstandingDebts.slice(0, 4).map((debt) => (
              <article key={debt.id} className="flex items-center justify-between rounded-[1.5rem] border border-white/8 bg-card p-4">
                <div>
                  <p className="font-extrabold text-cream">{debt.counterparty}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{debt.direction === 'owed_by_me' ? 'You owe' : 'Owed to you'}{debt.due_date ? ` · due ${debt.due_date}` : ''}</p>
                </div>
                <p className="text-lg font-extrabold text-cream tabular-nums">{money(debt.balance)}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid place-items-center gap-2 rounded-[1.8rem] border border-dashed border-white/12 px-6 py-10 text-center">
            <HandCoins className="size-10 text-muted-foreground" />
            <p className="font-extrabold text-cream">Nothing outstanding</p>
          </div>
        )}
      </section>
    </Page>
  )
}
