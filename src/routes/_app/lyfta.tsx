import { createFileRoute } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Doodle } from '@/components/sunrise/illustrations'
import { formatSetSummary, workoutDate, workoutRecord } from '@/components/sunrise/lyfta-session-card'
import { Page, PageHeader, SectionTitle } from '@/components/sunrise/primitives'
import { getLyftaWorkoutsData } from '@/lib/app.functions'
import type { LyftaExercise, LyftaSet, LyftaWorkout } from '@/lib/lyfta'

export const Route = createFileRoute('/_app/lyfta')({
  loader: () => getLyftaWorkoutsData(),
  component: LyftaPage,
})

function LyftaPage() {
  const result = Route.useLoaderData()
  const records = result.workouts.filter((workout) => workoutRecord(workout)).length

  return (
    <Page>
      <PageHeader
        kicker="Lyfta"
        title="Iron log."
        description="Read-only workout history from Lyfta. Detailed training stays there."
        illustration="lyfta"
        aside={result.available && result.workouts.length ? (
          <div className="flex gap-2">
            <span className="rounded-full bg-white/8 px-3.5 py-1.5 text-sm font-extrabold text-cream">{result.workouts.length} sessions</span>
            {records > 0 && <span className="flex items-center gap-1.5 rounded-full bg-butter/15 px-3.5 py-1.5 text-sm font-extrabold text-butter"><Trophy className="size-4" /> {records} with PRs</span>}
          </div>
        ) : undefined}
      />

      {!result.available ? (
        <EmptyState title="Lyfta isn't connected" description={`${result.reason}. Add it as a Cloudflare secret named LYFTA_API_KEY to show workouts here.`} />
      ) : result.workouts.length ? (
        <section className="space-y-3">
          <SectionTitle title="Recent sessions" />
          {result.workouts.map((workout, index) => <WorkoutCard key={workout.id || `${workout.title}-${workout.performedAt}`} workout={workout} index={index} />)}
        </section>
      ) : (
        <EmptyState title="No workouts returned" description="The API key is configured, but Lyfta did not return workout records for this page." />
      )}
    </Page>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-[1.8rem] border border-dashed border-white/12 px-6 py-14 text-center">
      <Doodle kind="flame" className="size-20" />
      <p className="text-lg font-extrabold text-cream">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function WorkoutCard({ workout, index }: { workout: LyftaWorkout; index: number }) {
  const sets = workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
  const record = workoutRecord(workout)
  return (
    <article className={`rise overflow-hidden rounded-[1.8rem] border p-5 ${index === 0 ? 'border-sun/20 bg-[linear-gradient(150deg,#3a1d2e,#1c1836_60%)]' : 'border-white/8 bg-card'}`} style={{ '--d': Math.min(index, 6) + 1 } as CSSProperties}>
      <p className="text-xs font-extrabold tracking-[0.14em] text-sun uppercase">{workoutDate(workout.performedAt) || 'Date not provided'}</p>
      <h2 className="mt-1 text-2xl leading-tight font-extrabold tracking-tight text-cream">{workout.title}</h2>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[['Time', workout.duration], ['Volume', workout.totalVolume], ['Sets', sets ? String(sets) : null]].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/6 px-3 py-2.5"><p className="truncate text-lg leading-tight font-extrabold text-cream">{value || '—'}</p><p className="text-xs font-semibold text-muted-foreground">{label}</p></div>
        ))}
      </div>
      {record && <div className="sun-shimmer mt-4 inline-flex max-w-full items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-extrabold text-[#3a1a05]"><Trophy className="size-4 shrink-0" strokeWidth={2.6} /><span className="truncate">PR · {record.exercise}{record.value ? ` · ${record.value}` : ''}</span></div>}

      {workout.exercises.length ? (
        <div className="mt-5 space-y-4 border-t border-white/8 pt-4">
          {workout.exercises.map((exercise) => <ExerciseRow key={`${exercise.id}-${exercise.name}`} exercise={exercise} />)}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-muted-foreground">No exercise details returned for this workout.</p>
      )}
    </article>
  )
}

function ExerciseRow({ exercise }: { exercise: LyftaExercise }) {
  const completedSets = exercise.sets.filter((set) => set.completed !== false)
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-extrabold text-cream">{exercise.name}</h3>
        {exercise.type && <p className="shrink-0 text-xs font-bold tracking-wide text-muted-foreground uppercase">{exercise.type.replaceAll('_', ' ')}</p>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(completedSets.length ? completedSets : exercise.sets).map((set, index) => (
          <span key={set.id || index} className={`rounded-full px-3 py-1.5 text-sm font-bold tabular-nums ${set.recordType ? 'bg-butter/18 text-butter' : 'bg-white/7 text-cream/85'}`}>
            {set.recordType && <Trophy className="mr-1 -mt-0.5 inline size-3.5" />}{formatSet(set, index)}
          </span>
        ))}
        {!exercise.sets.length && <span className="text-sm text-muted-foreground">No sets returned</span>}
      </div>
    </section>
  )
}

function formatSet(set: LyftaSet, index: number) {
  const parts = [`Set ${index + 1}`]
  const summary = formatSetSummary(set)
  if (summary) parts.push(summary)
  if (set.rir) parts.push(`${set.rir} RIR`)
  return parts.join(' · ')
}
