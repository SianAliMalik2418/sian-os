import { createFileRoute } from '@tanstack/react-router'
import { HeartPulse, Save, Target, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getProfileData } from '@/lib/app.functions'
import type { Profile } from '@/lib/types'

export const Route = createFileRoute('/_app/profile')({ loader: () => getProfileData(), component: ProfilePage })

const numericFields = new Set(['height_cm', 'weight_kg', 'age'])

function ProfilePage() {
  const profile = Route.useLoaderData()
  const [values, setValues] = useState(() => valuesFromProfile(profile))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>()
  const [error, setError] = useState<string>()

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatus(undefined)
    setError(undefined)
    const payload = Object.fromEntries(Object.entries(values).flatMap(([key, value]) => (
      value === '' ? [] : [[key, numericFields.has(key) ? Number(value) : value]]
    )))

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not save profile')
      setStatus('Profile saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Profile</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Your context, in one place.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Keep your baseline, goals, schedule, and health context current.</p>
      </header>

      <Form onSubmit={submit} className="space-y-5">
        <Card>
          <CardHeader>
            <div><CardTitle>Baseline</CardTitle><CardDescription>Core details used to understand your wellness data</CardDescription></div>
            <CardAction><UserRound className="size-5 text-primary" /></CardAction>
          </CardHeader>
          <CardPanel className="grid gap-4 sm:grid-cols-3">
            <ProfileField label="Age"><Input nativeInput type="number" min="1" max="130" inputMode="numeric" value={values.age || ''} onChange={(event) => update('age', event.target.value)} /></ProfileField>
            <ProfileField label="Height" description="Centimeters"><Input nativeInput type="number" min="1" max="300" step="0.1" inputMode="decimal" value={values.height_cm || ''} onChange={(event) => update('height_cm', event.target.value)} /></ProfileField>
            <ProfileField label="Current weight" description="Kilograms"><Input nativeInput type="number" min="1" max="500" step="0.1" inputMode="decimal" value={values.weight_kg || ''} onChange={(event) => update('weight_kg', event.target.value)} /></ProfileField>
          </CardPanel>
        </Card>

        <Card>
          <CardHeader>
            <div><CardTitle>Direction</CardTitle><CardDescription>What you are working toward and why it matters</CardDescription></div>
            <CardAction><Target className="size-5 text-primary" /></CardAction>
          </CardHeader>
          <CardPanel className="grid gap-4">
            <ProfileField label="Goals"><Textarea rows={4} value={values.goals || ''} onChange={(event) => update('goals', event.target.value)} placeholder="Your current health and fitness goals…" /></ProfileField>
            <ProfileField label="Long-term vision"><Textarea rows={4} value={values.long_term_vision || ''} onChange={(event) => update('long_term_vision', event.target.value)} placeholder="What sustainable progress looks like to you…" /></ProfileField>
          </CardPanel>
        </Card>

        <Card>
          <CardHeader>
            <div><CardTitle>Training and environment</CardTitle><CardDescription>Context for recommendations; workouts remain tracked in Hevy</CardDescription></div>
            <CardAction><HeartPulse className="size-5 text-primary" /></CardAction>
          </CardHeader>
          <CardPanel className="grid gap-4 sm:grid-cols-2">
            <ProfileField label="Experience level"><Input nativeInput value={values.experience_level || ''} onChange={(event) => update('experience_level', event.target.value)} placeholder="Beginner, intermediate…" /></ProfileField>
            <ProfileField label="Training style"><Input nativeInput value={values.training_style || ''} onChange={(event) => update('training_style', event.target.value)} /></ProfileField>
            <ProfileField label="Schedule"><Textarea rows={3} value={values.gym_schedule || ''} onChange={(event) => update('gym_schedule', event.target.value)} /></ProfileField>
            <ProfileField label="Equipment"><Textarea rows={3} value={values.equipment || ''} onChange={(event) => update('equipment', event.target.value)} /></ProfileField>
            <div className="sm:col-span-2"><ProfileField label="Injuries or limitations"><Textarea rows={3} value={values.injuries || ''} onChange={(event) => update('injuries', event.target.value)} placeholder="Current or relevant history…" /></ProfileField></div>
          </CardPanel>
        </Card>

        {(status || error) && <p role="status" className={`rounded-xl px-3 py-2 text-sm ${error ? 'bg-destructive/10 text-destructive-foreground' : 'bg-primary/10 text-primary'}`}>{error || status}</p>}
        <div className="flex justify-end"><Button type="submit" size="lg" loading={saving}><Save /> Save profile</Button></div>
      </Form>
    </div>
  )
}

function valuesFromProfile(profile: Profile | null) {
  const values: Record<string, string> = {}
  if (!profile) return values
  for (const [key, value] of Object.entries(profile)) {
    if (value !== null && !['id', 'updated_at'].includes(key)) values[key] = String(value)
  }
  return values
}

function ProfileField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return <Field><FieldLabel>{label}</FieldLabel>{children}{description && <FieldDescription>{description}</FieldDescription>}</Field>
}
