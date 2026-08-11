import { createFileRoute } from '@tanstack/react-router'
import { HeartPulse, Pencil, Save, Target, UserRound, X } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
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
  const loadedProfile = Route.useLoaderData()
  const [profile, setProfile] = useState(loadedProfile)
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState(() => valuesFromProfile(loadedProfile))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>()
  const [error, setError] = useState<string>()

  function beginEditing() {
    setValues(valuesFromProfile(profile))
    setStatus(undefined)
    setError(undefined)
    setEditing(true)
  }

  function cancelEditing() {
    setValues(valuesFromProfile(profile))
    setError(undefined)
    setEditing(false)
  }

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
      const result = await response.json() as { data?: Profile; error?: { message?: string } }
      if (!response.ok || !result.data) throw new Error(result.error?.message || 'Could not save profile')
      setProfile(result.data)
      setValues(valuesFromProfile(result.data))
      setEditing(false)
      setStatus('Profile saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Profile</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Your context, in one place.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Your baseline, goals, schedule, and health context.</p>
        </div>
        {!editing && <Button type="button" size="lg" onClick={beginEditing}><Pencil /> Edit profile</Button>}
      </header>

      {status && <p role="status" className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">{status}</p>}

      {editing ? (
        <ProfileEditor values={values} saving={saving} onUpdate={update} onSubmit={submit} onCancel={cancelEditing} error={error} />
      ) : (
        <ProfileOverview profile={profile} onEdit={beginEditing} />
      )}
    </div>
  )
}

function ProfileOverview({ profile, onEdit }: { profile: Profile | null; onEdit: () => void }) {
  if (!profile) {
    return <Card><CardPanel className="py-16 text-center"><UserRound className="mx-auto mb-3 size-8 text-muted-foreground" /><p className="font-medium">No profile details yet</p><p className="mt-1 text-sm text-muted-foreground">Add your baseline and goals when you are ready.</p><Button type="button" className="mt-5" onClick={onEdit}><Pencil /> Create profile</Button></CardPanel></Card>
  }

  return <div className="space-y-5">
    <Card>
      <CardHeader>
        <div><CardTitle>Baseline</CardTitle><CardDescription>Core details used to understand your wellness data</CardDescription></div>
        <CardAction><UserRound className="size-5 text-primary" /></CardAction>
      </CardHeader>
      <CardPanel className="grid gap-3 sm:grid-cols-3">
        <ProfileMetric label="Age" value={profile.age === null ? null : `${profile.age} years`} />
        <ProfileMetric label="Height" value={profile.height_cm === null ? null : `${profile.height_cm} cm`} />
        <ProfileMetric label="Current weight" value={profile.weight_kg === null ? null : `${profile.weight_kg} kg`} />
      </CardPanel>
    </Card>

    <Card>
      <CardHeader>
        <div><CardTitle>Direction</CardTitle><CardDescription>What you are working toward and why it matters</CardDescription></div>
        <CardAction><Target className="size-5 text-primary" /></CardAction>
      </CardHeader>
      <CardPanel className="grid gap-5">
        <ProfileValue label="Goals" value={profile.goals} />
        <ProfileValue label="Long-term vision" value={profile.long_term_vision} />
      </CardPanel>
    </Card>

    <Card>
      <CardHeader>
        <div><CardTitle>Training and environment</CardTitle><CardDescription>Context for recommendations; workouts remain tracked in Lyfta</CardDescription></div>
        <CardAction><HeartPulse className="size-5 text-primary" /></CardAction>
      </CardHeader>
      <CardPanel className="grid gap-5 sm:grid-cols-2">
        <ProfileValue label="Experience level" value={profile.experience_level} />
        <ProfileValue label="Training style" value={profile.training_style} />
        <ProfileValue label="Schedule" value={profile.gym_schedule} />
        <ProfileValue label="Equipment" value={profile.equipment} />
        <div className="sm:col-span-2"><ProfileValue label="Injuries or limitations" value={profile.injuries} /></div>
      </CardPanel>
    </Card>
  </div>
}

function ProfileEditor({ values, saving, onUpdate, onSubmit, onCancel, error }: {
  values: Record<string, string>
  saving: boolean
  onUpdate: (name: string, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  error?: string
}) {
  return <Form onSubmit={onSubmit} className="space-y-5">
    <Card>
      <CardHeader>
        <div><CardTitle>Edit baseline</CardTitle><CardDescription>Core details used to understand your wellness data</CardDescription></div>
        <CardAction><UserRound className="size-5 text-primary" /></CardAction>
      </CardHeader>
      <CardPanel className="grid gap-4 sm:grid-cols-3">
        <ProfileField label="Age"><Input nativeInput type="number" min="1" max="130" inputMode="numeric" value={values.age || ''} onChange={(event) => onUpdate('age', event.target.value)} /></ProfileField>
        <ProfileField label="Height" description="Centimeters"><Input nativeInput type="number" min="1" max="300" step="0.1" inputMode="decimal" value={values.height_cm || ''} onChange={(event) => onUpdate('height_cm', event.target.value)} /></ProfileField>
        <ProfileField label="Current weight" description="Kilograms"><Input nativeInput type="number" min="1" max="500" step="0.1" inputMode="decimal" value={values.weight_kg || ''} onChange={(event) => onUpdate('weight_kg', event.target.value)} /></ProfileField>
      </CardPanel>
    </Card>

    <Card>
      <CardHeader>
        <div><CardTitle>Edit direction</CardTitle><CardDescription>What you are working toward and why it matters</CardDescription></div>
        <CardAction><Target className="size-5 text-primary" /></CardAction>
      </CardHeader>
      <CardPanel className="grid gap-4">
        <ProfileField label="Goals"><Textarea rows={4} value={values.goals || ''} onChange={(event) => onUpdate('goals', event.target.value)} placeholder="Your current health and fitness goals…" /></ProfileField>
        <ProfileField label="Long-term vision"><Textarea rows={4} value={values.long_term_vision || ''} onChange={(event) => onUpdate('long_term_vision', event.target.value)} placeholder="What sustainable progress looks like to you…" /></ProfileField>
      </CardPanel>
    </Card>

    <Card>
      <CardHeader>
        <div><CardTitle>Edit training and environment</CardTitle><CardDescription>Context for recommendations; workouts remain tracked in Lyfta</CardDescription></div>
        <CardAction><HeartPulse className="size-5 text-primary" /></CardAction>
      </CardHeader>
      <CardPanel className="grid gap-4 sm:grid-cols-2">
        <ProfileField label="Experience level"><Input nativeInput value={values.experience_level || ''} onChange={(event) => onUpdate('experience_level', event.target.value)} placeholder="Beginner, intermediate…" /></ProfileField>
        <ProfileField label="Training style"><Input nativeInput value={values.training_style || ''} onChange={(event) => onUpdate('training_style', event.target.value)} /></ProfileField>
        <ProfileField label="Schedule"><Textarea rows={3} value={values.gym_schedule || ''} onChange={(event) => onUpdate('gym_schedule', event.target.value)} /></ProfileField>
        <ProfileField label="Equipment"><Textarea rows={3} value={values.equipment || ''} onChange={(event) => onUpdate('equipment', event.target.value)} /></ProfileField>
        <div className="sm:col-span-2"><ProfileField label="Injuries or limitations"><Textarea rows={3} value={values.injuries || ''} onChange={(event) => onUpdate('injuries', event.target.value)} placeholder="Current or relevant history…" /></ProfileField></div>
      </CardPanel>
    </Card>

    {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel} disabled={saving}><X /> Cancel</Button><Button type="submit" size="lg" loading={saving}><Save /> Save profile</Button></div>
  </Form>
}

function valuesFromProfile(profile: Profile | null) {
  const values: Record<string, string> = {}
  if (!profile) return values
  for (const [key, value] of Object.entries(profile)) {
    if (value !== null && !['id', 'updated_at'].includes(key)) values[key] = String(value)
  }
  return values
}

function ProfileMetric({ label, value }: { label: string; value: string | null }) {
  return <div className="rounded-xl border bg-secondary/30 p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 font-heading text-2xl font-semibold tabular-nums">{value || 'Not set'}</p></div>
}

function ProfileValue({ label, value }: { label: string; value: string | null }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${value ? 'text-foreground' : 'text-muted-foreground'}`}>{value || 'Not set'}</p></div>
}

function ProfileField({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return <Field><FieldLabel>{label}</FieldLabel>{children}{description && <FieldDescription>{description}</FieldDescription>}</Field>
}
