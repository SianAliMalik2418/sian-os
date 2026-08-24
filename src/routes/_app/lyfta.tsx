import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays, Dumbbell, Timer, TrendingUp } from 'lucide-react'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { getLyftaWorkoutsData } from '@/lib/app.functions'
import type { LyftaExercise, LyftaSet, LyftaWorkout } from '@/lib/lyfta'

export const Route = createFileRoute('/_app/lyfta')({
  loader: () => getLyftaWorkoutsData(),
  component: LyftaPage,
})

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

function LyftaPage() {
  const result = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Lyfta</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Workout records from Lyfta.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Read-only workout history pulled from Lyfta. Detailed training data stays authoritative there.</p>
        </div>
        <div className="rounded-2xl border bg-secondary/30 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Loaded workouts</p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{result.workouts.length}</p>
        </div>
      </header>

      {!result.available ? (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Dumbbell /></EmptyMedia>
              <EmptyTitle>Lyfta is not connected</EmptyTitle>
              <EmptyDescription>{result.reason}. Add it as a Cloudflare secret named LYFTA_API_KEY to show workouts here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : result.workouts.length ? (
        <div className="space-y-4">
          {result.workouts.map((workout) => <WorkoutCard key={workout.id || `${workout.title}-${workout.performedAt}`} workout={workout} />)}
        </div>
      ) : (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Dumbbell /></EmptyMedia>
              <EmptyTitle>No Lyfta workouts returned</EmptyTitle>
              <EmptyDescription>The API key is configured, but Lyfta did not return workout records for this page.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      )}
    </div>
  )
}

function WorkoutCard({ workout }: { workout: LyftaWorkout }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{workout.title}</CardTitle>
          <CardDescription>{formatWorkoutDate(workout.performedAt)}</CardDescription>
        </div>
        <CardAction><Dumbbell className="size-5 text-primary" /></CardAction>
      </CardHeader>
      <CardPanel className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <WorkoutMetric icon={CalendarDays} label="Date" value={formatWorkoutDate(workout.performedAt)} />
          <WorkoutMetric icon={Timer} label="Duration" value={workout.duration || 'Not provided'} />
          <WorkoutMetric icon={TrendingUp} label="Volume" value={workout.totalVolume || 'Not provided'} />
        </div>

        {workout.exercises.length ? (
          <div className="divide-y rounded-xl border">
            {workout.exercises.map((exercise) => <ExerciseRow key={`${exercise.id}-${exercise.name}`} exercise={exercise} />)}
          </div>
        ) : (
          <p className="rounded-xl border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">No exercise details returned for this workout.</p>
        )}
      </CardPanel>
    </Card>
  )
}

function WorkoutMetric({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><Icon className="size-4" /> {label}</div>
      <p className="mt-2 truncate font-heading text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function ExerciseRow({ exercise }: { exercise: LyftaExercise }) {
  const completedSets = exercise.sets.filter((set) => set.completed !== false)
  return (
    <section className="grid gap-3 p-4 md:grid-cols-[minmax(12rem,0.35fr)_minmax(0,1fr)]">
      <div>
        <h2 className="font-heading text-base font-semibold">{exercise.name}</h2>
        {exercise.type && <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{exercise.type.replaceAll('_', ' ')}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {(completedSets.length ? completedSets : exercise.sets).map((set, index) => (
          <span key={set.id || index} className="rounded-lg bg-secondary px-3 py-2 text-sm tabular-nums text-secondary-foreground">
            {formatSet(set, index)}
          </span>
        ))}
        {!exercise.sets.length && <span className="text-sm text-muted-foreground">No sets returned</span>}
      </div>
    </section>
  )
}

function formatSet(set: LyftaSet, index: number) {
  const parts = [`Set ${index + 1}`]
  if (set.weight && set.reps) parts.push(`${set.weight} x ${set.reps}`)
  else if (set.reps) parts.push(`${set.reps} reps`)
  else if (set.duration) parts.push(set.duration)
  if (set.rir) parts.push(`${set.rir} RIR`)
  if (set.recordValue) parts.push(set.recordValue)
  return parts.join(' · ')
}

function formatWorkoutDate(value: string | null) {
  if (!value) return 'Date not provided'
  const normalized = value.includes(' ') ? value.replace(' ', 'T') : value
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}
