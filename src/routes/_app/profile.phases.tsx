import { createFileRoute } from '@tanstack/react-router'
import { Target } from 'lucide-react'
import { phaseLabels, useChangePhaseDialog } from '@/components/phase-dialog-provider'
import { Doodle } from '@/components/sunrise/illustrations'
import { Page, PageHeader, SectionTitle } from '@/components/sunrise/primitives'
import { getGoalPhasesData } from '@/lib/app.functions'
import type { GoalPhase } from '@/lib/types'

export const Route = createFileRoute('/_app/profile/phases')({ loader: () => getGoalPhasesData(), component: PhasesPage })

function targetLabel(phase: GoalPhase) {
  return phase.target_rate_kg_per_week === null
    ? 'No numeric target'
    : `${phase.target_rate_kg_per_week > 0 ? '+' : ''}${phase.target_rate_kg_per_week} kg/week`
}

function PhasesPage() {
  const phases = Route.useLoaderData()
  const { openPhaseDialog } = useChangePhaseDialog()
  const active = phases.find((phase) => phase.is_active)
  const past = phases.filter((phase) => !phase.is_active)

  return (
    <Page>
      <PageHeader
        kicker="Profile"
        title="Phases."
        description="The current structured phase and weekly target, separate from your long-term vision."
        illustration="profile"
        actions={<button type="button" onClick={openPhaseDialog} className="flex items-center gap-2 rounded-full bg-cream px-4 py-2.5 text-sm font-extrabold text-[#1d1330]"><Target className="size-4" strokeWidth={2.6} /> Start new phase</button>}
      />

      <section className="space-y-3">
        <SectionTitle title="Active phase" />
        {active ? (
          <div className="rounded-[1.8rem] border border-white/8 bg-card p-5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl font-extrabold text-cream">{phaseLabels[active.phase_type] ?? active.phase_type}</p>
              <p className="text-sm font-bold text-muted-foreground">Since {active.started_at}</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">{targetLabel(active)}</p>
            {active.note && <p className="mt-3 text-sm font-medium text-cream/90">{active.note}</p>}
          </div>
        ) : (
          <div className="grid place-items-center gap-2 rounded-[1.8rem] border border-dashed border-white/12 px-6 py-14 text-center">
            <Doodle kind="check" className="size-20" />
            <p className="text-lg font-extrabold text-cream">No active phase</p>
            <p className="max-w-xs text-sm text-muted-foreground">Start one to track a concrete cut/bulk/recomp target against your weight trend.</p>
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <SectionTitle title="Past phases" meta={`${past.length}`} />
          <div className="space-y-2">
            {past.map((phase) => (
              <div key={phase.id} className="rounded-[1.4rem] border border-white/8 bg-card p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-extrabold text-cream">{phaseLabels[phase.phase_type] ?? phase.phase_type}</p>
                  <p className="text-sm font-semibold text-muted-foreground">{phase.started_at} → {phase.ended_at}</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{targetLabel(phase)}</p>
                {phase.note && <p className="mt-1 text-sm text-cream/80">{phase.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </Page>
  )
}
