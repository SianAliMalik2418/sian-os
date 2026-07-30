import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Dumbbell, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getWorkoutData } from '@/lib/app.functions'

export const Route = createFileRoute('/_app/workouts')({
  loader: () => getWorkoutData(),
  component: WorkoutsPage,
})

interface DraftSet {
  exercise: string
  reps: string
  weight_kg: string
  rpe: string
  rir: string
  rest_seconds: string
  notes: string
}

const emptySet = (): DraftSet => ({ exercise: '', reps: '', weight_kg: '', rpe: '', rir: '', rest_seconds: '', notes: '' })
const today = () => new Date().toISOString().slice(0, 10)

function WorkoutsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [editingId, setEditingId] = useState<number>()
  const [date, setDate] = useState(today())
  const [title, setTitle] = useState('')
  const [program, setProgram] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [sets, setSets] = useState<DraftSet[]>([emptySet()])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>()
  const historyByExercise = useMemo(() => data.sets.reduce((map, set) => {
    const key = set.exercise_name.toLocaleLowerCase()
    map.set(key, [...(map.get(key) || []), set])
    return map
  }, new Map<string, typeof data.sets>()), [data.sets])

  function reset() {
    setEditingId(undefined); setDate(today()); setTitle(''); setProgram(''); setDuration(''); setNotes(''); setSets([emptySet()]); setMessage(undefined)
  }

  function updateSet(index: number, key: keyof DraftSet, value: string) {
    setSets((current) => current.map((set, setIndex) => setIndex === index ? { ...set, [key]: value } : set))
  }

  function editWorkout(id: number) {
    const workout = data.workouts.find((item) => item.id === id)
    if (!workout) return
    const workoutSets = data.sets.filter((set) => set.workout_id === id)
    setEditingId(id); setDate(workout.date); setTitle(workout.title); setProgram(workout.program || ''); setDuration(workout.duration_minutes?.toString() || ''); setNotes(workout.notes || '')
    setSets(workoutSets.length ? workoutSets.map((set) => ({ exercise: set.exercise_name, reps: set.reps?.toString() || '', weight_kg: set.weight_kg?.toString() || '', rpe: set.rpe?.toString() || '', rir: set.rir?.toString() || '', rest_seconds: set.rest_seconds?.toString() || '', notes: set.notes || '' })) : [emptySet()])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true); setMessage(undefined)
    const numeric = (value: string) => value === '' ? undefined : Number(value)
    const payload = {
      date, title, program: program || undefined, duration_minutes: numeric(duration), notes: notes || undefined,
      sets: sets.filter((set) => set.exercise.trim()).map((set, index) => ({
        exercise: set.exercise.trim(), set_number: index + 1, reps: numeric(set.reps), weight_kg: numeric(set.weight_kg), rpe: numeric(set.rpe), rir: numeric(set.rir), rest_seconds: numeric(set.rest_seconds), notes: set.notes || undefined,
      })),
    }
    try {
      const response = await fetch(editingId ? `/api/workouts/${editingId}` : '/api/workouts', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not save workout')
      reset()
      await router.invalidate()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save workout')
    } finally { setSaving(false) }
  }

  async function deleteWorkout(id: number) {
    if (!window.confirm('Delete this workout and every set in it? This cannot be undone.')) return
    const response = await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
    if (response.ok) { if (editingId === id) reset(); await router.invalidate() }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <header><p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Training log</p><h1 className="mt-2 font-heading text-3xl font-semibold">{editingId ? 'Edit workout' : 'Log a workout'}</h1><p className="mt-2 text-muted-foreground">Record the work. Previous performance stays visible while you build the next session.</p></header>

      <form onSubmit={submit} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Session</CardTitle><CardDescription>The frame around today’s work</CardDescription>{editingId && <CardAction><Button variant="ghost" size="sm" onClick={reset}><X /> Cancel edit</Button></CardAction>}</CardHeader>
          <CardPanel className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Date"><DatePicker value={date} onValueChange={setDate} required /></Field>
            <Field label="Title"><Input nativeInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Push strength" required /></Field>
            <Field label="Program"><Input nativeInput value={program} onChange={(event) => setProgram(event.target.value)} placeholder="Optional block" /></Field>
            <Field label="Duration (minutes)"><Input nativeInput type="number" min="0" value={duration} onChange={(event) => setDuration(event.target.value)} /></Field>
            <div className="sm:col-span-2 lg:col-span-4"><Field label="Session notes"><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="How the session felt, changes, pain, or context…" rows={2} /></Field></div>
          </CardPanel>
        </Card>

        <Card>
          <CardHeader><CardTitle>Working sets</CardTitle><CardDescription>Exercise, load, reps, and effort</CardDescription><CardAction><Button variant="outline" size="sm" onClick={() => setSets((current) => [...current, emptySet()])}><Plus /> Add set</Button></CardAction></CardHeader>
          <CardPanel className="space-y-3">
            <datalist id="exercise-library">{data.exercises.map((exercise) => <option key={exercise.id} value={exercise.name} />)}</datalist>
            {sets.map((set, index) => {
              const previous = historyByExercise.get(set.exercise.toLocaleLowerCase())?.find((item) => item.workout_id !== editingId)
              return <div key={index} className="rounded-xl border p-3">
                <div className="mb-3 flex items-center justify-between"><Badge variant="secondary">Set {index + 1}</Badge>{sets.length > 1 && <button type="button" onClick={() => setSets((current) => current.filter((_, setIndex) => setIndex !== index))} className="rounded-md p-1 text-muted-foreground hover:text-destructive-foreground" aria-label={`Remove set ${index + 1}`}><Trash2 className="size-4" /></button>}</div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                  <div className="sm:col-span-2"><Field label="Exercise"><Input nativeInput list="exercise-library" value={set.exercise} onChange={(event) => updateSet(index, 'exercise', event.target.value)} placeholder="Bench press" /></Field></div>
                  <Field label="Weight kg"><Input nativeInput type="number" min="0" step="0.25" value={set.weight_kg} onChange={(event) => updateSet(index, 'weight_kg', event.target.value)} /></Field>
                  <Field label="Reps"><Input nativeInput type="number" min="0" value={set.reps} onChange={(event) => updateSet(index, 'reps', event.target.value)} /></Field>
                  <Field label="RPE"><Input nativeInput type="number" min="0" max="10" step="0.5" value={set.rpe} onChange={(event) => updateSet(index, 'rpe', event.target.value)} /></Field>
                  <Field label="RIR"><Input nativeInput type="number" min="0" max="20" step="0.5" value={set.rir} onChange={(event) => updateSet(index, 'rir', event.target.value)} /></Field>
                  <Field label="Rest sec"><Input nativeInput type="number" min="0" value={set.rest_seconds} onChange={(event) => updateSet(index, 'rest_seconds', event.target.value)} /></Field>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><Field label="Set note"><Input nativeInput value={set.notes} onChange={(event) => updateSet(index, 'notes', event.target.value)} placeholder="Tempo, technique, assistance…" /></Field>{previous && <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">Previous: <strong className="text-foreground">{previous.weight_kg ?? 0} kg × {previous.reps ?? 0}</strong>{previous.rpe ? ` @ RPE ${previous.rpe}` : ''}</p>}</div>
              </div>
            })}
          </CardPanel>
        </Card>
        <div className="flex items-center justify-between gap-4"><p className="text-sm text-destructive-foreground">{message}</p><Button type="submit" size="lg" loading={saving}><Save /> {editingId ? 'Update workout' : 'Save workout'}</Button></div>
      </form>

      <section>
        <div className="mb-4 flex items-end justify-between"><div><h2 className="font-heading text-2xl font-semibold">Recent workouts</h2><p className="text-sm text-muted-foreground">{data.workouts.length} saved sessions</p></div></div>
        {data.workouts.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.workouts.map((workout) => {
          const workoutSets = data.sets.filter((set) => set.workout_id === workout.id)
          return <Card key={workout.id}><CardHeader><CardTitle>{workout.title}</CardTitle><CardDescription>{workout.date}{workout.duration_minutes ? ` · ${workout.duration_minutes} min` : ''}</CardDescription><CardAction><Badge variant="outline">{workoutSets.length} sets</Badge></CardAction></CardHeader><CardPanel className="space-y-2">{workoutSets.slice(0, 4).map((set) => <div key={set.id} className="flex justify-between text-sm"><span>{set.exercise_name}</span><span className="text-muted-foreground">{set.weight_kg ?? 0} kg × {set.reps ?? 0}</span></div>)}{workoutSets.length > 4 && <p className="text-xs text-muted-foreground">+{workoutSets.length - 4} more sets</p>}<div className="flex gap-2 border-t pt-3"><Button variant="outline" size="sm" onClick={() => editWorkout(workout.id)}><Pencil /> Edit</Button><Button variant="destructive-outline" size="sm" onClick={() => deleteWorkout(workout.id)}><Trash2 /> Delete</Button></div></CardPanel></Card>
        })}</div> : <Card><CardPanel className="py-14 text-center"><Dumbbell className="mx-auto mb-3 size-8 text-muted-foreground" /><p className="font-medium">No sessions yet</p><p className="mt-1 text-sm text-muted-foreground">Your first completed workout will appear here.</p></CardPanel></Card>}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label>
}
