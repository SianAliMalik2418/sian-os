import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Camera, Droplets, Plus, Scale, Trash2, Utensils } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getProgressData } from '@/lib/app.functions'

export const Route = createFileRoute('/_app/progress')({ loader: () => getProgressData(), component: ProgressPage })

const today = () => new Date().toISOString().slice(0, 10)

function ProgressPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [status, setStatus] = useState<string>()
  const [saving, setSaving] = useState(false)

  async function submitJson(event: FormEvent<HTMLFormElement>, endpoint: string) {
    event.preventDefault(); setSaving(true); setStatus(undefined)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const payload = Object.fromEntries([...form.entries()].flatMap(([key, value]) => value === '' ? [] : [[key, key === 'date' || key === 'meal' || key === 'supplements' || key === 'notes' ? value : Number(value)]]))
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not save')
      formElement.reset(); setStatus('Saved. Your progress data is current.'); await router.invalidate()
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save') } finally { setSaving(false) }
  }

  async function uploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setStatus(undefined)
    const formElement = event.currentTarget
    try {
      const response = await fetch('/api/progress-photos', { method: 'POST', body: new FormData(formElement) })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not upload photo')
      formElement.reset(); setStatus('Photo stored privately.'); await router.invalidate()
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not upload photo') } finally { setSaving(false) }
  }

  async function deletePhoto(id: number) {
    if (!window.confirm('Delete this progress photo permanently?')) return
    if ((await fetch(`/api/progress-photos/${id}`, { method: 'DELETE' })).ok) await router.invalidate()
  }

  return <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
    <header><p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Progress and recovery</p><h1 className="mt-2 font-heading text-3xl font-semibold">Watch patterns, not noise.</h1><p className="mt-2 text-muted-foreground">Body trends, nutrition consistency, hydration, and private progress photos in one place.</p>{status && <p className="mt-3 text-sm text-primary">{status}</p>}</header>

    <section className="grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Body measurement</CardTitle><CardDescription>Track periodically; weekly and monthly direction matters most</CardDescription><CardAction><Scale className="size-5 text-primary" /></CardAction></CardHeader><CardPanel>
        <form onSubmit={(event) => submitJson(event, '/api/body-measurements')} className="grid gap-4 sm:grid-cols-2">
          <Field label="Date"><Input nativeInput name="date" type="date" defaultValue={today()} required /></Field>
          {[['weight_kg','Weight (kg)'],['chest_cm','Chest (cm)'],['waist_cm','Waist (cm)'],['hips_cm','Hips (cm)'],['arm_cm','Arm (cm)'],['thigh_cm','Thigh (cm)']].map(([name,label]) => <Field key={name} label={label}><Input nativeInput name={name} type="number" min="0" step="0.1" /></Field>)}
          <div className="sm:col-span-2"><Field label="Notes"><Textarea name="notes" rows={2} /></Field></div><div className="sm:col-span-2 flex justify-end"><Button type="submit" loading={saving}><Plus /> Add measurement</Button></div>
        </form>
        <div className="mt-6 space-y-2 border-t pt-4">{data.measurements.slice(0, 8).map((item) => <div key={String(item.id)} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm"><span>{String(item.date)}</span><span className="tabular-nums">{item.weight_kg ? `${item.weight_kg} kg` : item.waist_cm ? `${item.waist_cm} cm waist` : 'Measurements saved'}</span></div>)}{!data.measurements.length && <p className="py-5 text-center text-sm text-muted-foreground">No body measurements yet.</p>}</div>
      </CardPanel></Card>

      <Card><CardHeader><CardTitle>Nutrition log</CardTitle><CardDescription>Keep this lightweight: consistency beats precision</CardDescription><CardAction><Utensils className="size-5 text-primary" /></CardAction></CardHeader><CardPanel>
        <form onSubmit={(event) => submitJson(event, '/api/nutrition')} className="grid gap-4 sm:grid-cols-2">
          <Field label="Date"><Input nativeInput name="date" type="date" defaultValue={today()} required /></Field><Field label="Meal / summary"><Input nativeInput name="meal" placeholder="High-protein breakfast" /></Field><Field label="Protein (g)"><Input nativeInput name="protein_grams" type="number" min="0" /></Field><Field label="Water (L)"><Input nativeInput name="water_liters" type="number" min="0" step="0.1" /></Field><Field label="Consistency (1–10)"><Input nativeInput name="consistency" type="number" min="1" max="10" /></Field><Field label="Supplements"><Input nativeInput name="supplements" /></Field><div className="sm:col-span-2"><Field label="Notes"><Textarea name="notes" rows={2} /></Field></div><div className="sm:col-span-2 flex justify-end"><Button type="submit" loading={saving}><Plus /> Add nutrition log</Button></div>
        </form>
        <div className="mt-6 space-y-2 border-t pt-4">{data.nutrition.slice(0, 8).map((item) => <div key={String(item.id)} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm"><div><span>{String(item.date)}</span>{item.meal && <span className="ml-2 text-muted-foreground">{String(item.meal)}</span>}</div><div className="flex gap-2">{item.protein_grams && <Badge variant="outline">{String(item.protein_grams)}g protein</Badge>}{item.water_liters && <Badge variant="info"><Droplets />{String(item.water_liters)}L</Badge>}</div></div>)}{!data.nutrition.length && <p className="py-5 text-center text-sm text-muted-foreground">No nutrition logs yet.</p>}</div>
      </CardPanel></Card>
    </section>

    <Card><CardHeader><CardTitle>Private progress photos</CardTitle><CardDescription>Original files live in the private R2 bucket; metadata lives in D1</CardDescription><CardAction><Camera className="size-5 text-primary" /></CardAction></CardHeader><CardPanel>
      <form onSubmit={uploadPhoto} className="grid gap-4 rounded-xl border border-dashed p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"><Field label="Date"><Input nativeInput name="date" type="date" defaultValue={today()} required /></Field><Field label="Label"><Input nativeInput name="label" placeholder="Front, side, month 3…" /></Field><Field label="Photo"><Input nativeInput name="photo" type="file" accept="image/*" required /></Field><Button type="submit" loading={saving}><Camera /> Upload privately</Button></form>
      {data.photos.length ? <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{data.photos.map((photo) => <figure key={String(photo.id)} className="group relative overflow-hidden rounded-xl border bg-secondary"><img src={`/api/progress-photos/${photo.id}`} alt={String(photo.label || `Progress photo ${photo.date}`)} className="aspect-[3/4] w-full object-cover" loading="lazy" /><figcaption className="p-3"><p className="text-sm font-medium">{String(photo.label || 'Progress')}</p><p className="text-xs text-muted-foreground">{String(photo.date)}</p></figcaption><button type="button" onClick={() => deletePhoto(Number(photo.id))} className="absolute right-2 top-2 rounded-lg bg-background/80 p-2 opacity-0 backdrop-blur transition group-hover:opacity-100" aria-label="Delete photo"><Trash2 className="size-4" /></button></figure>)}</div> : <p className="py-10 text-center text-sm text-muted-foreground">No progress photos yet.</p>}
    </CardPanel></Card>
  </div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label> }
