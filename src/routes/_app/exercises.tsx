import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, ChartNoAxesCombined, Dumbbell, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { getExerciseData } from '@/lib/app.functions'

export const Route = createFileRoute('/_app/exercises')({ loader: () => getExerciseData(), component: ExercisesPage })

function ExercisesPage() {
  const exercises = Route.useLoaderData()
  return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
    <header className="mb-6"><p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Exercise library</p><h1 className="mt-2 font-heading text-3xl font-semibold">Know what is moving.</h1><p className="mt-2 text-muted-foreground">History, records, and training frequency for every movement you log.</p></header>
    {exercises.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{exercises.map((exercise) => <Card key={exercise.id}>
      <CardHeader><CardTitle>{exercise.name}</CardTitle><CardDescription>{exercise.muscle_group || 'Uncategorized'}{exercise.equipment ? ` · ${exercise.equipment}` : ''}</CardDescription><CardAction><Badge variant="outline">{exercise.workout_count} sessions</Badge></CardAction></CardHeader>
      <CardPanel><div className="grid grid-cols-2 gap-3"><Metric icon={Trophy} label="Best weight" value={exercise.max_weight ? `${exercise.max_weight} kg` : '—'} /><Metric icon={ChartNoAxesCombined} label="Est. 1RM" value={exercise.estimated_1rm ? `${Math.round(exercise.estimated_1rm)} kg` : '—'} /></div><div className="mt-4 flex items-center justify-between border-t pt-4 text-sm"><span className="text-muted-foreground">{exercise.last_trained ? `Last: ${exercise.last_trained}` : 'Not trained yet'}</span><Link to="/exercises/$exerciseId" params={{ exerciseId: String(exercise.id) }} className="inline-flex items-center gap-1 font-medium text-primary">History <ArrowRight className="size-4" /></Link></div></CardPanel>
    </Card>)}</div> : <Card><CardPanel className="py-16 text-center"><Dumbbell className="mx-auto mb-3 size-8 text-muted-foreground" /><p className="font-medium">Your library is built automatically</p><p className="mt-1 text-sm text-muted-foreground">Log a workout to add your first reusable exercise.</p><Link to="/workouts" className="mt-4 inline-block text-sm font-medium text-primary">Log workout</Link></CardPanel></Card>}
  </div>
}

function Metric({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return <div className="rounded-xl bg-secondary p-3"><Icon className="mb-2 size-4 text-primary" /><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium tabular-nums">{value}</p></div>
}
