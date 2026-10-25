import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Save, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Notice, Page, PageHeader, SectionTitle } from '@/components/sunrise/primitives'
import { getFinanceSettingsData } from '@/lib/app.functions'
import { levelDescriptions, levelLabels } from '@/lib/finance-levels'
import type { FinanceCategoryInput, FinanceSettingsInput } from '@/lib/schemas'
import type { FinanceCategory, FinanceLevel, FinanceSettings } from '@/lib/types'

export const Route = createFileRoute('/finance/settings')({ loader: () => getFinanceSettingsData(), component: SettingsPage })

const levels: FinanceLevel[] = ['muslim', 'mumin', 'muhsin']
const buckets = ['family', 'self', 'service'] as const

type ApiErrorResult = { error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } }

function errorMessageFrom(result: ApiErrorResult, fallback: string) {
  const fieldErrors = result.error?.details?.fieldErrors
  const entries = fieldErrors ? Object.entries(fieldErrors).filter(([, messages]) => messages.length) : []
  if (entries.length) return entries.map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('; ')
  return result.error?.message || fallback
}

function pctKey(level: FinanceLevel, bucket: typeof buckets[number]) {
  return `${level}_${bucket}_pct` as const
}

function SettingsPage() {
  const { settings: initialSettings, categories: initialCategories } = Route.useLoaderData()
  const router = useRouter()
  const [settings, setSettings] = useState<FinanceSettings>(initialSettings)
  const [categories, setCategories] = useState<FinanceCategory[]>(initialCategories)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [status, setStatus] = useState<string>()

  const [categoryName, setCategoryName] = useState('')
  const [categoryBucket, setCategoryBucket] = useState<'family' | 'self' | 'service'>('family')
  const [categorySaving, setCategorySaving] = useState(false)

  function updatePct(level: FinanceLevel, bucket: typeof buckets[number], value: string) {
    setSettings((current) => ({ ...current, [pctKey(level, bucket)]: Number(value) || 0 }))
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(undefined)
    setStatus(undefined)
    const payload: FinanceSettingsInput = {
      level: settings.level,
      emergency_fund_target: settings.emergency_fund_target ?? undefined,
      emergency_fund_balance: settings.emergency_fund_balance,
    }
    for (const level of levels) for (const bucket of buckets) {
      const key = pctKey(level, bucket)
      ;(payload as Record<string, number>)[key] = settings[key]
    }
    try {
      const response = await fetch('/api/finance/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json() as { data?: FinanceSettings } & ApiErrorResult
      if (!response.ok || !result.data) throw new Error(errorMessageFrom(result, 'Could not save settings'))
      setSettings(result.data)
      setStatus('Saved.')
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCategorySaving(true)
    setError(undefined)
    const payload: FinanceCategoryInput = { name: categoryName.trim(), bucket: categoryBucket }
    try {
      const response = await fetch('/api/finance/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json() as { data?: FinanceCategory } & ApiErrorResult
      if (!response.ok || !result.data) throw new Error(errorMessageFrom(result, 'Could not add category'))
      setCategories((current) => [...current, result.data!].sort((a, b) => a.bucket.localeCompare(b.bucket) || a.name.localeCompare(b.name)))
      setCategoryName('')
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add category')
    } finally {
      setCategorySaving(false)
    }
  }

  async function removeCategory(id: number) {
    setError(undefined)
    try {
      const response = await fetch(`/api/finance/categories/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete category')
      setCategories((current) => current.filter((category) => category.id !== id))
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete category')
    }
  }

  return (
    <Page>
      <PageHeader kicker="Finance" title="Settings" description="Tune your allocation framework and categories." illustration="profile" />

      <Form onSubmit={saveSettings} className="rise space-y-5 rounded-[1.8rem] border border-white/8 bg-card p-5">
        <Field>
          <FieldLabel>Active level</FieldLabel>
          <Select value={settings.level} onValueChange={(value) => value && setSettings((current) => ({ ...current, level: value as FinanceLevel }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {levels.map((level) => <SelectItem key={level} value={level}>{levelLabels[level]}</SelectItem>)}
            </SelectContent>
          </Select>
          <FieldDescription>{levelDescriptions[settings.level]}</FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          {levels.map((level) => (
            <div key={level} className={`rounded-2xl border p-4 ${settings.level === level ? 'border-sun/40 bg-sun/5' : 'border-white/8'}`}>
              <p className="mb-3 font-extrabold text-cream">{levelLabels[level]}</p>
              <div className="grid gap-2.5">
                {buckets.map((bucket) => (
                  <Field key={bucket}>
                    <FieldLabel className="capitalize">{bucket} %</FieldLabel>
                    <Input nativeInput type="number" min="0" max="100" step="1" value={settings[pctKey(level, bucket)]} onChange={(event) => updatePct(level, bucket, event.target.value)} />
                  </Field>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Emergency fund target (Rs)</FieldLabel>
            <Input nativeInput type="number" min="0" step="1" value={settings.emergency_fund_target ?? ''} onChange={(event) => setSettings((current) => ({ ...current, emergency_fund_target: event.target.value ? Number(event.target.value) : null }))} placeholder="3–6 months of expenses" />
          </Field>
          <Field>
            <FieldLabel>Emergency fund balance (Rs)</FieldLabel>
            <Input nativeInput type="number" min="0" step="1" value={settings.emergency_fund_balance} onChange={(event) => setSettings((current) => ({ ...current, emergency_fund_balance: Number(event.target.value) || 0 }))} />
          </Field>
        </div>

        {error && <p role="alert" className="rounded-2xl bg-destructive/12 px-4 py-3 text-sm font-semibold text-destructive-foreground">{error}</p>}
        {status && <Notice tone="status">{status}</Notice>}
        <Button type="submit" loading={saving} className="h-11 w-fit rounded-full px-6 font-extrabold"><Save /> Save settings</Button>
      </Form>

      <section className="space-y-3">
        <SectionTitle title="Categories" meta={`${categories.length} total`} />
        <Form onSubmit={addCategory} className="rise flex flex-wrap items-end gap-3 rounded-[1.8rem] border border-white/8 bg-card p-5">
          <Field className="min-w-40 flex-1">
            <FieldLabel>Name</FieldLabel>
            <Input nativeInput required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Rent" />
          </Field>
          <Field className="w-40">
            <FieldLabel>Bucket</FieldLabel>
            <Select value={categoryBucket} onValueChange={(value) => value && setCategoryBucket(value as typeof categoryBucket)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="self">Self</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Button type="submit" loading={categorySaving} className="h-11 rounded-full px-5 font-extrabold">Add</Button>
        </Form>

        {categories.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-card px-4 py-3">
                <span className="font-bold text-cream">{category.name} <span className="ml-1 text-xs font-semibold text-muted-foreground capitalize">{category.bucket}</span></span>
                <Button type="button" size="icon-sm" variant="ghost" onClick={() => removeCategory(category.id)} aria-label={`Delete ${category.name}`} className="text-destructive-foreground"><Trash2 /></Button>
              </div>
            ))}
          </div>
        ) : (
          <Notice tone="status">No categories yet — add one above before logging transactions.</Notice>
        )}
      </section>
    </Page>
  )
}
