import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Check, Moon, Save, Sparkles } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getTodayCheckin } from '@/lib/app.functions'

export const Route = createFileRoute('/_app/check-in')({
  loader: () => getTodayCheckin(),
  component: CheckInPage,
})

const numberFields = [
  ['weight_kg', 'Weight', 'kg', '0.1', 'e.g. 72.4'],
  ['sleep_hours', 'Sleep duration', 'hours', '0.25', 'e.g. 7.5'],
  ['water_liters', 'Water', 'liters', '0.1', 'e.g. 2.5'],
  ['protein_grams', 'Protein estimate', 'grams', '1', 'e.g. 140'],
] as const

const ratingFields = [
  ['sleep_quality', 'Sleep quality'],
  ['energy', 'Energy'],
  ['motivation', 'Motivation'],
  ['recovery', 'Recovery'],
  ['soreness', 'Soreness'],
  ['stress', 'Stress'],
] as const

function CheckInPage() {
  const existing = Route.useLoaderData()
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { date: today }
    if (existing) {
      for (const [key, value] of Object.entries(existing)) if (value !== null && value !== undefined) initial[key] = String(value)
    }
    return initial
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>()

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage(undefined)
    const numericKeys = new Set<string>([...numberFields.map(([key]) => key), ...ratingFields.map(([key]) => key)])
    const payload = Object.fromEntries(Object.entries(values).flatMap(([key, value]) => {
      if (value === '') return []
      return [[key, numericKeys.has(key) ? Number(value) : value]]
    }))
    try {
      const response = await fetch('/api/checkins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json() as { ok: boolean; error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not save check-in')
      setMessage('Today is saved. Your dashboard is up to date.')
      await router.invalidate()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save check-in')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="mb-6"><p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Daily rhythm</p><h1 className="mt-2 font-heading text-3xl font-semibold">{existing ? 'Edit today’s check-in' : 'How are you today?'}</h1><p className="mt-2 text-muted-foreground">A fast, honest snapshot gives future you—and your coach—better signal.</p></header>
      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basics</CardTitle><CardDescription>Body, sleep, hydration, and fuel</CardDescription></CardHeader>
          <CardPanel className="grid gap-5 sm:grid-cols-2">
            <Field label="Date"><Input nativeInput type="date" value={values.date} onChange={(event) => update('date', event.target.value)} required /></Field>
            {numberFields.map(([name, label, unit, step, placeholder]) => <Field key={name} label={label} hint={unit}><Input nativeInput type="number" min="0" step={step} placeholder={placeholder} value={values[name] || ''} onChange={(event) => update(name, event.target.value)} /></Field>)}
            <Field label="Mood" hint="one word is enough"><Input nativeInput placeholder="Calm, focused, flat…" value={values.mood || ''} onChange={(event) => update('mood', event.target.value)} /></Field>
          </CardPanel>
        </Card>

        <Card>
          <CardHeader><CardTitle>Readiness</CardTitle><CardDescription>Rate each signal from 1 (low) to 10 (high)</CardDescription></CardHeader>
          <CardPanel className="grid gap-5 sm:grid-cols-2">
            {ratingFields.map(([name, label]) => {
              const value = Number(values[name] || 5)
              return <label key={name} className="rounded-xl border p-4"><span className="flex items-center justify-between text-sm font-medium"><span>{label}</span><strong className="text-primary">{value}/10</strong></span><input type="range" min="1" max="10" step="1" value={value} onChange={(event) => update(name, event.target.value)} className="mt-4 w-full accent-[var(--primary)]" /></label>
            })}
          </CardPanel>
        </Card>

        <Card>
          <CardHeader><CardTitle>Context</CardTitle><CardDescription>Capture anything numbers would miss</CardDescription></CardHeader>
          <CardPanel><Textarea value={values.notes || ''} onChange={(event) => update('notes', event.target.value)} placeholder="Training notes, aches, schedule pressure, appetite, or anything your future coach should know…" rows={5} /></CardPanel>
        </Card>

        <div className="sticky bottom-4 flex flex-col-reverse gap-3 rounded-2xl border bg-background/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className={`px-2 text-sm ${message?.includes('Could not') ? 'text-destructive-foreground' : 'text-muted-foreground'}`}>{message || <span className="inline-flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Usually takes under two minutes.</span>}</p>
          <Button type="submit" size="lg" loading={saving}>{existing ? <Check /> : <Save />}{existing ? 'Update today' : 'Save check-in'}</Button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="grid gap-2"><span className="flex items-center justify-between text-sm font-medium"><span>{label}</span>{hint && <span className="font-normal text-muted-foreground">{hint}</span>}</span>{children}</label>
}
