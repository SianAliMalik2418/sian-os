import { useRouter } from '@tanstack/react-router'
import { Check, Clock3, Save } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { calculateSleepHours } from '@/lib/metrics'
import type { DailyCheckin } from '@/lib/types'

const numericFields = ['weight_kg', 'water_liters', 'protein_grams'] as const

const DailyCheckinDialogContext = createContext<{ openCheckin: () => void } | null>(null)

export function useDailyCheckinDialog() {
  const context = useContext(DailyCheckinDialogContext)
  if (!context) throw new Error('useDailyCheckinDialog must be used inside DailyCheckinDialogProvider')
  return context
}

export function DailyCheckinDialogProvider({ existing, children }: { existing: DailyCheckin | null; children: ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(() => valuesFromCheckin(existing))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (open) {
      setValues(valuesFromCheckin(existing))
      setError(undefined)
    }
  }, [existing, open])

  const sleepHours = useMemo(() => {
    if (!/^\d{2}:\d{2}$/.test(values.sleep_time || '') || !/^\d{2}:\d{2}$/.test(values.wake_time || '')) return null
    return calculateSleepHours(values.sleep_time, values.wake_time)
  }, [values.sleep_time, values.wake_time])

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(undefined)
    const numeric = new Set<string>(numericFields)
    const payload = Object.fromEntries(Object.entries(values).flatMap(([key, value]) => {
      if (value === '') return []
      return [[key, numeric.has(key) ? Number(value) : value]]
    }))

    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not save check-in')
      setOpen(false)
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save check-in')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DailyCheckinDialogContext.Provider value={{ openCheckin: () => setOpen(true) }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup className="h-[min(46rem,calc(100dvh-2rem))] max-w-xl max-sm:h-[calc(100dvh-3rem)]">
          <Form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle>{existing ? 'Edit today’s check-in' : 'Daily check-in'}</DialogTitle>
                {existing && <Badge variant="success"><Check /> Saved</Badge>}
              </div>
              <DialogDescription>Log the essentials. Sleep duration is calculated from your sleep and wake times.</DialogDescription>
            </DialogHeader>

            <DialogPanel className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <CheckinField label="Date">
                  <DatePicker value={values.date} onValueChange={(date) => update('date', date)} required />
                </CheckinField>
                <CheckinField label="Weight" description="Kilograms">
                  <Input nativeInput type="number" min="0" step="0.1" inputMode="decimal" placeholder="72.4" value={values.weight_kg || ''} onChange={(event) => update('weight_kg', event.target.value)} />
                </CheckinField>
              </div>

              <section className="rounded-2xl border bg-muted/40 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><p className="font-heading font-semibold">Sleep</p><p className="mt-1 text-xs text-muted-foreground">Overnight times are handled automatically.</p></div>
                  <Badge variant={sleepHours === null ? 'secondary' : 'info'}><Clock3 /> {sleepHours === null ? 'Add times' : `${sleepHours} hours`}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CheckinField label="Sleep time">
                    <Input nativeInput type="time" value={values.sleep_time || ''} onChange={(event) => update('sleep_time', event.target.value)} />
                  </CheckinField>
                  <CheckinField label="Wake time">
                    <Input nativeInput type="time" value={values.wake_time || ''} onChange={(event) => update('wake_time', event.target.value)} />
                  </CheckinField>
                </div>
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <CheckinField label="Water" description="Liters">
                  <Input nativeInput type="number" min="0" step="0.1" inputMode="decimal" placeholder="2.5" value={values.water_liters || ''} onChange={(event) => update('water_liters', event.target.value)} />
                </CheckinField>
                <CheckinField label="Protein" description="Estimated grams">
                  <Input nativeInput type="number" min="0" step="1" inputMode="numeric" placeholder="140" value={values.protein_grams || ''} onChange={(event) => update('protein_grams', event.target.value)} />
                </CheckinField>
              </div>

              <CheckinField label="Notes" description="Optional context for training, appetite, aches, or schedule changes">
                <Textarea value={values.notes || ''} onChange={(event) => update('notes', event.target.value)} placeholder="Anything worth remembering today…" rows={5} />
              </CheckinField>

              {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}
            </DialogPanel>

            <DialogFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" loading={saving}><Save /> {existing ? 'Update today' : 'Save check-in'}</Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>
    </DailyCheckinDialogContext.Provider>
  )
}

function valuesFromCheckin(existing: DailyCheckin | null) {
  const values: Record<string, string> = { date: new Date().toISOString().slice(0, 10) }
  if (!existing) return values
  for (const [key, value] of Object.entries(existing)) {
    if (value !== null && value !== undefined && !['id', 'created_at', 'updated_at', 'sleep_hours'].includes(key)) values[key] = String(value)
  }
  return values
}

function CheckinField({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return <Field><FieldLabel>{label}</FieldLabel>{children}{description && <FieldDescription>{description}</FieldDescription>}</Field>
}
