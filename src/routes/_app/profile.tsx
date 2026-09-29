import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, Dumbbell, HeartPulse, Images, Pencil, Save, Target, TrendingUp, UserRound, X } from 'lucide-react'
import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { EditableNumber } from '@/components/sunrise/editable-number'
import { Doodle, HeaderIllustration } from '@/components/sunrise/illustrations'
import { Notice, Page, PageHeader, SectionTitle, ToneTile } from '@/components/sunrise/primitives'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getProfileData } from '@/lib/app.functions'
import type { Profile } from '@/lib/types'

export const Route = createFileRoute('/_app/profile')({ loader: () => getProfileData(), component: ProfilePage })

const numericFields = new Set(['height_cm', 'weight_kg', 'age', 'calorie_goal', 'protein_goal'])

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

  async function saveGoal(field: 'calorie_goal' | 'protein_goal', value: number) {
    if (!profile) throw new Error('Create a profile first')
    const payload = Object.fromEntries(
      Object.entries({ ...profile, [field]: value }).flatMap(([key, value]) => (
        ['id', 'updated_at'].includes(key) || value === null || value === undefined ? [] : [[key, value]]
      )),
    )
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await response.json() as { data?: Profile; error?: { message?: string } }
    if (!response.ok || !result.data) throw new Error(result.error?.message || 'Could not save goal')
    setProfile(result.data)
    setValues(valuesFromProfile(result.data))
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
    <Page>
      <PageHeader
        kicker="Profile"
        title="Your summit plan."
        description="Baseline, goals, and training context your coach works from."
        illustration="profile"
        actions={!editing ? <button type="button" onClick={beginEditing} className="flex items-center gap-2 rounded-full bg-cream px-4 py-2.5 text-sm font-extrabold text-[#1d1330] transition-transform active:scale-95"><Pencil className="size-4" strokeWidth={2.6} /> Edit profile</button> : undefined}
      />

      {status && <Notice tone="status">{status}</Notice>}

      {editing ? (
        <ProfileEditor values={values} saving={saving} onUpdate={update} onSubmit={submit} onCancel={cancelEditing} error={error} />
      ) : (
        <>
          <ProfileOverview profile={profile} onEdit={beginEditing} onSaveGoal={saveGoal} />
          <ProfileMiniPages />
        </>
      )}
    </Page>
  )
}

const delay = (d: number) => ({ '--d': d }) as CSSProperties

function ProfileMiniPages() {
  return (
    <section className="space-y-3">
      <SectionTitle title="More of you" />
      <div className="grid grid-cols-2 gap-3">
        <Link to="/lyfta" className="rise group relative min-h-40 overflow-hidden rounded-[1.8rem] border border-sun/20 bg-[linear-gradient(150deg,rgb(255_107_44/.24),#1c1836_75%)] p-4" style={delay(8)}>
          <HeaderIllustration kind="lyfta" className="absolute -right-4 -bottom-2 w-32 opacity-90" />
          <Dumbbell className="size-6 text-sun" strokeWidth={2.4} />
          <p className="mt-3 text-xl font-extrabold text-cream">Lyfta</p>
          <p className="mt-0.5 text-sm font-semibold text-muted-foreground">Workouts & PRs</p>
          <ArrowUpRight className="absolute top-4 right-4 size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
        <Link to="/gallery" className="rise group relative min-h-40 overflow-hidden rounded-[1.8rem] border border-lilac/20 bg-[linear-gradient(150deg,rgb(167_139_250/.24),#1c1836_75%)] p-4" style={delay(9)}>
          <HeaderIllustration kind="gallery" className="absolute -right-6 -bottom-4 w-32 opacity-90" />
          <Images className="size-6 text-lilac" strokeWidth={2.4} />
          <p className="mt-3 text-xl font-extrabold text-cream">Gallery</p>
          <p className="mt-0.5 text-sm font-semibold text-muted-foreground">Progress photos</p>
          <ArrowUpRight className="absolute top-4 right-4 size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  )
}

function ProfileOverview({ profile, onEdit, onSaveGoal }: {
  profile: Profile | null
  onEdit: () => void
  onSaveGoal: (field: 'calorie_goal' | 'protein_goal', value: number) => Promise<void>
}) {
  if (!profile) {
    return (
      <div className="grid place-items-center gap-2 rounded-[1.8rem] border border-dashed border-white/12 px-6 py-14 text-center">
        <Doodle kind="check" className="size-20" />
        <p className="text-lg font-extrabold text-cream">No profile yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">Add your baseline and goals so every number has context.</p>
        <button type="button" onClick={onEdit} className="mt-3 flex items-center gap-2 rounded-full bg-sun px-5 py-2.5 font-extrabold text-[#1d1330]"><Pencil className="size-4" /> Create profile</button>
      </div>
    )
  }

  return <div className="space-y-5">
    <section className="rise flex items-center gap-4 rounded-[1.8rem] border border-white/8 bg-card p-4" style={delay(1)}>
      <div className="relative grid size-16 shrink-0 place-items-center rounded-full bg-[linear-gradient(160deg,#ffd23f,#ff6b2c)] text-2xl font-extrabold text-[#1d1330]">
        S
        <span className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full border-2 border-card bg-mint"><TrendingUp className="size-3 text-[#120f24]" strokeWidth={3} /></span>
      </div>
      <div className="grid flex-1 grid-cols-3 divide-x divide-white/8">
        <BaselineStat label="Age" value={profile.age === null ? null : String(profile.age)} unit="yrs" />
        <BaselineStat label="Height" value={profile.height_cm === null ? null : String(profile.height_cm)} unit="cm" />
        <BaselineStat label="Weight" value={profile.weight_kg === null ? null : String(profile.weight_kg)} unit="kg" />
      </div>
    </section>

    <div className="grid grid-cols-2 gap-3">
      <ToneTile tone="sun" label="Calorie goal" className="rise" style={delay(2)} doodle={<Doodle kind="flame" />} value={<EditableNumber value={profile.calorie_goal} unit="kcal" max={20000} ariaLabel="Calorie goal" placeholder="Tap to set" onSave={(next) => onSaveGoal('calorie_goal', next)} />} footer="Daily target · tap to edit" />
      <ToneTile tone="mint" label="Protein goal" className="rise" style={delay(3)} doodle={<Doodle kind="protein" />} value={<EditableNumber value={profile.protein_goal} unit="g" max={2000} ariaLabel="Protein goal" placeholder="Tap to set" onSave={(next) => onSaveGoal('protein_goal', next)} />} footer="Daily target · tap to edit" />
    </div>

    <section className="rise space-y-4 rounded-[1.8rem] border border-white/8 bg-card p-5" style={delay(4)}>
      <IconHeading icon={Target} tone="text-sun bg-sun/15" title="Direction" />
      <ProfileValue label="Goals" value={profile.goals} />
      <ProfileValue label="Long-term vision" value={profile.long_term_vision} />
    </section>

    <section className="rise space-y-4 rounded-[1.8rem] border border-white/8 bg-card p-5" style={delay(5)}>
      <IconHeading icon={HeartPulse} tone="text-lilac bg-lilac/15" title="Training & environment" />
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileValue label="Experience" value={profile.experience_level} />
        <ProfileValue label="Training style" value={profile.training_style} />
        <ProfileValue label="Schedule" value={profile.gym_schedule} />
        <ProfileValue label="Equipment" value={profile.equipment} />
        <div className="sm:col-span-2"><ProfileValue label="Injuries or limitations" value={profile.injuries} /></div>
      </div>
    </section>
  </div>
}

function IconHeading({ icon: Icon, tone, title }: { icon: typeof Target; tone: string; title: string }) {
  return <div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-2xl ${tone}`}><Icon className="size-5" strokeWidth={2.4} /></span><h2 className="text-lg font-extrabold text-cream">{title}</h2></div>
}

function BaselineStat({ label, value, unit }: { label: string; value: string | null; unit: string }) {
  return <div className="px-2 text-center first:pl-0 last:pr-0"><p className="text-xl font-extrabold text-cream tabular-nums">{value ?? '—'}{value && <small className="ml-0.5 text-xs font-bold text-muted-foreground">{unit}</small>}</p><p className="text-xs font-semibold text-muted-foreground">{label}</p></div>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Calorie goal" description="Daily kcal"><Input nativeInput type="number" min="0" max="20000" step="1" inputMode="numeric" value={values.calorie_goal || ''} onChange={(event) => onUpdate('calorie_goal', event.target.value)} placeholder="2200" /></ProfileField>
          <ProfileField label="Protein goal" description="Daily grams"><Input nativeInput type="number" min="0" max="2000" step="1" inputMode="numeric" value={values.protein_goal || ''} onChange={(event) => onUpdate('protein_goal', event.target.value)} placeholder="100" /></ProfileField>
        </div>
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

    {error && <Notice tone="error">{error}</Notice>}
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

function ProfileValue({ label, value }: { label: string; value: string | null }) {
  return <div><p className="text-xs font-extrabold tracking-[0.12em] text-muted-foreground uppercase">{label}</p><p className={`mt-1.5 whitespace-pre-wrap text-[0.95rem] leading-relaxed font-medium ${value ? 'text-cream' : 'text-muted-foreground'}`}>{value || 'Not set'}</p></div>
}

function ProfileField({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return <Field><FieldLabel>{label}</FieldLabel>{children}{description && <FieldDescription>{description}</FieldDescription>}</Field>
}
