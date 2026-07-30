import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ChartNoAxesCombined, Dumbbell, Flame, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { getExerciseDetail } from '@/lib/app.functions'
import { progressionSuggestion } from '@/lib/metrics'

export const Route = createFileRoute('/_app/exercises/$exerciseId')({
  loader: ({ params }) => getExerciseDetail({ data: { exerciseId: Number(params.exerciseId) } }),
  component: ExerciseDetailPage,
})

function ExerciseDetailPage() {
  const { exercise, history, records } = Route.useLoaderData()
  const recent = history[0]
  const suggestion = progressionSuggestion(recent)
  const recentSessions = new Set(history.slice(0, 15).map((set) => set.workout_id)).size

  return <div className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
    <header><Link to="/exercises" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Exercise library</Link><p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Exercise history</p><h1 className="mt-2 font-heading text-3xl font-semibold">{exercise.name}</h1><p className="mt-2 text-muted-foreground">{exercise.muscle_group || 'Uncategorized'}{exercise.equipment ? ` · ${exercise.equipment}` : ''}</p></header>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <RecordCard icon={Trophy} label="Max weight" value={records?.max_weight ? `${records.max_weight} kg` : '—'} />
      <RecordCard icon={Flame} label="Max reps" value={records?.max_reps?.toString() || '—'} />
      <RecordCard icon={ChartNoAxesCombined} label="Estimated 1RM" value={records?.estimated_1rm ? `${Math.round(records.estimated_1rm)} kg` : '—'} />
      <RecordCard icon={Dumbbell} label="Sessions" value={records?.sessions?.toString() || '0'} />
    </section>
    <Card className="border-primary/20"><CardHeader><CardTitle>Next-session suggestion</CardTitle><CardDescription>Simple double-progression guidance based on your latest set</CardDescription></CardHeader><CardPanel><p className="text-sm leading-6">{suggestion}</p><div className="mt-3 flex gap-2"><Badge variant="secondary">{recentSessions} recent sessions</Badge>{recent?.rpe && <Badge variant="outline">Last RPE {recent.rpe}</Badge>}</div></CardPanel></Card>
    <Card><CardHeader><CardTitle>Full history</CardTitle><CardDescription>{history.length} logged sets, newest first</CardDescription></CardHeader><CardPanel>
      {history.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Workout</th><th className="pb-3 font-medium">Set</th><th className="pb-3 font-medium">Weight</th><th className="pb-3 font-medium">Reps</th><th className="pb-3 font-medium">RPE / RIR</th><th className="pb-3 font-medium">e1RM</th></tr></thead><tbody>{history.map((set, index) => <tr key={`${set.workout_id}-${set.set_number}-${index}`} className="border-b last:border-0"><td className="py-3 tabular-nums">{set.date}</td><td className="py-3">{set.title}</td><td className="py-3">{set.set_number}</td><td className="py-3 tabular-nums">{set.weight_kg ?? '—'} kg</td><td className="py-3 tabular-nums">{set.reps ?? '—'}</td><td className="py-3 text-muted-foreground">{set.rpe ?? '—'} / {set.rir ?? '—'}</td><td className="py-3 tabular-nums text-primary">{set.estimated_1rm ? `${set.estimated_1rm} kg` : '—'}</td></tr>)}</tbody></table></div> : <p className="py-10 text-center text-sm text-muted-foreground">No sets logged for this exercise.</p>}
    </CardPanel></Card>
  </div>
}

function RecordCard({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return <Card><CardHeader><Icon className="mb-2 size-5 text-primary" /><CardDescription>{label}</CardDescription><CardTitle className="text-2xl tabular-nums">{value}</CardTitle></CardHeader></Card>
}
