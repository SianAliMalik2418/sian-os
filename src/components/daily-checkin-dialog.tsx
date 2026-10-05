import { useRouter } from '@tanstack/react-router'
import { Check, Save } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { NutritionEntryTracker, type NutritionEntryTrackerHandle } from '@/components/nutrition-entry-tracker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { queueCheckin, readQueuedCheckins, syncQueuedCheckins } from '@/lib/offline-checkins'
import type { CheckinInput } from '@/lib/schemas'
import type { DailyCheckin, Profile } from '@/lib/types'

const numericFields = ['weight_kg', 'waist_inches', 'water_liters', 'steps', 'active_calories', 'protein_grams', 'fat_grams', 'carb_grams', 'calories'] as const
const today = () => new Date().toISOString().slice(0, 10)

const DailyCheckinDialogContext = createContext<{ openCheckin: (date?: string) => void } | null>(null)

export function useDailyCheckinDialog() {
  const context = useContext(DailyCheckinDialogContext)
  if (!context) throw new Error('useDailyCheckinDialog must be used inside DailyCheckinDialogProvider')
  return context
}

export function DailyCheckinDialogProvider({ existing, profile, children }: { existing: DailyCheckin | null; profile: Profile | null; children: ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DailyCheckin | null>(existing)
  const [values, setValues] = useState<Record<string, string>>(() => valuesFromCheckin(existing))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [syncMessage, setSyncMessage] = useState<string>()
  const [pendingCount, setPendingCount] = useState(0)
  const nutritionTrackerRef = useRef<NutritionEntryTrackerHandle>(null)

  const refreshPendingCount = useCallback(() => {
    setPendingCount(readQueuedCheckins().length)
  }, [])

  const syncPendingCheckins = useCallback(async () => {
    const result = await syncQueuedCheckins()
    setPendingCount(result.pending)

    if (result.synced > 0) {
      setSyncMessage(`${result.synced} offline check-in${result.synced === 1 ? '' : 's'} synced`)
      await router.invalidate()
    }

    if (result.failed) {
      setSyncMessage(`Offline sync blocked: ${result.failed.lastError}`)
    }
  }, [router])

  useEffect(() => {
    refreshPendingCount()
    void syncPendingCheckins()
    window.addEventListener('online', syncPendingCheckins)
    return () => window.removeEventListener('online', syncPendingCheckins)
  }, [refreshPendingCount, syncPendingCheckins])

  useEffect(() => {
    if (!syncMessage || pendingCount > 0) return

    const timeout = window.setTimeout(() => setSyncMessage(undefined), 5000)
    return () => window.clearTimeout(timeout)
  }, [pendingCount, syncMessage])

  const calorieGoal = profile?.calorie_goal || 2200
  const proteinGoal = profile?.protein_goal || 100

  async function openCheckin(date = today()) {
    setOpen(true)
    setError(undefined)
    setSyncMessage(undefined)

    const queued = readQueuedCheckins().find((item) => item.payload.date === date)
    if (queued) {
      setEditing(null)
      setValues(valuesFromQueuedCheckin(queued.payload))
      setSyncMessage('This check-in is saved offline and will sync when you are online.')
      return
    }

    if (existing?.date === date) {
      setEditing(existing)
      setValues(valuesFromCheckin(existing))
      return
    }

    setEditing(null)
    setValues(valuesFromCheckin(null, date))
    setLoading(true)
    try {
      const response = await fetch(`/api/checkins?date=${encodeURIComponent(date)}`)
      const result = await response.json() as { data?: DailyCheckin | null; error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not load check-in')
      if (result.data) {
        setEditing(result.data)
        setValues(valuesFromCheckin(result.data))
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load check-in')
    } finally {
      setLoading(false)
    }
  }

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function updateNutritionTotals(nextCheckin: DailyCheckin) {
    setEditing(nextCheckin)
    setValues((current) => ({
      ...current,
      calories: nextCheckin.calories === null ? '' : String(nextCheckin.calories),
      protein_grams: nextCheckin.protein_grams === null ? '' : String(nextCheckin.protein_grams),
      fat_grams: nextCheckin.fat_grams === null ? '' : String(nextCheckin.fat_grams),
      carb_grams: nextCheckin.carb_grams === null ? '' : String(nextCheckin.carb_grams),
    }))
    await router.invalidate()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(undefined)

    try {
      await nutritionTrackerRef.current?.flushSelections()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save selected recipes')
      setSaving(false)
      return
    }

    const numeric = new Set<string>(numericFields)
    const payload = Object.fromEntries(Object.entries(values).flatMap(([key, value]) => {
      if (value === '') return []
      return [[key, numeric.has(key) ? Number(value) : value]]
    })) as CheckinInput

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
      if (isOfflineSave(caught)) {
        queueCheckin(payload)
        refreshPendingCount()
        setOpen(false)
        setSyncMessage('Check-in saved offline. It will sync when the app is online.')
        return
      }

      setError(caught instanceof Error ? caught.message : 'Could not save check-in')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DailyCheckinDialogContext.Provider value={{ openCheckin }}>
      {children}
      <OfflineSyncStatus pendingCount={pendingCount} message={syncMessage} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup className="h-[min(52rem,calc(100dvh-2rem))] max-w-2xl max-sm:h-[calc(100dvh-3rem)]">
          <Form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sun/15"><svg viewBox="0 0 24 24" className="anim-spin-slow size-6" style={{ animationDuration: '14s' }} aria-hidden="true"><g stroke="#ffb065" strokeWidth="2" strokeLinecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></g><circle cx="12" cy="12" r="4.5" fill="#ff6b2c" /></svg></span>
                <DialogTitle className="text-xl font-extrabold tracking-tight">{editing ? 'Edit check-in' : 'Daily check-in'}</DialogTitle>
                {editing && <Badge variant="success"><Check /> Saved</Badge>}
                {pendingCount > 0 && <Badge variant="warning">{pendingCount} offline</Badge>}
              </div>
              <DialogDescription>Weight, waist, steps, active calories, and meals for one day.</DialogDescription>
            </DialogHeader>

            <DialogPanel className="grid grid-cols-1 gap-5">
              {loading && <p className="text-sm text-muted-foreground">Loading check-in…</p>}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CheckinField label="Date">
                  <DatePicker value={values.date} onValueChange={openCheckin} required />
                </CheckinField>
                <CheckinField label="Weight" description="Kilograms">
                  <Input nativeInput type="number" min="0" step="0.1" inputMode="decimal" placeholder="72.4" value={values.weight_kg || ''} onChange={(event) => update('weight_kg', event.target.value)} />
                </CheckinField>
                <CheckinField label="Waist" description="Inches">
                  <Input nativeInput type="number" min="0" step="0.1" inputMode="decimal" placeholder="31.5" value={values.waist_inches || ''} onChange={(event) => update('waist_inches', event.target.value)} />
                </CheckinField>
                <CheckinField label="Steps">
                  <Input nativeInput type="number" min="0" step="1" inputMode="numeric" placeholder="8000" value={values.steps || ''} onChange={(event) => update('steps', event.target.value)} />
                </CheckinField>
                <CheckinField label="Active calories" description="Kcal burned moving">
                  <Input nativeInput type="number" min="0" step="1" inputMode="numeric" placeholder="400" value={values.active_calories || ''} onChange={(event) => update('active_calories', event.target.value)} />
                </CheckinField>
              </div>

              <section className="rounded-[1.5rem] border border-white/8 bg-white/4 p-4">
                <div className="mb-4"><p className="font-extrabold text-cream">Meals</p><p className="mt-1 text-xs font-semibold text-muted-foreground">Each food row updates today's calories and protein.</p></div>
                <NutritionEntryTracker ref={nutritionTrackerRef} date={values.date} calorieGoal={calorieGoal} proteinGoal={proteinGoal} compact onCheckinChange={updateNutritionTotals} />
              </section>

              {error && <p role="alert" className="rounded-2xl bg-destructive/12 px-4 py-3 text-sm font-semibold text-destructive-foreground">{error}</p>}
              {syncMessage && <p role="status" className="rounded-2xl bg-mint/12 px-4 py-3 text-sm font-semibold text-mint">{syncMessage}</p>}
            </DialogPanel>

            <DialogFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
              <DialogClose render={<Button variant="ghost" className="rounded-full px-5 font-bold" />}>Cancel</DialogClose>
              <Button type="submit" loading={saving} disabled={loading} className="h-11 rounded-full px-6 font-extrabold"><Save /> {editing ? 'Save changes' : 'Save check-in'}</Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>

    </DailyCheckinDialogContext.Provider>
  )
}

function isOfflineSave(error: unknown) {
  return (typeof navigator !== 'undefined' && !navigator.onLine) || error instanceof TypeError
}

function valuesFromCheckin(existing: DailyCheckin | null, date = today()) {
  const values: Record<string, string> = { date }
  if (!existing) return values
  for (const [key, value] of Object.entries(existing)) {
    if (value !== null && value !== undefined && !['id', 'created_at', 'updated_at'].includes(key)) values[key] = String(value)
  }
  return values
}

function valuesFromQueuedCheckin(payload: CheckinInput) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, String(value)]))
}

function CheckinField({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return <Field><FieldLabel>{label}</FieldLabel>{children}{description && <FieldDescription>{description}</FieldDescription>}</Field>
}

function OfflineSyncStatus({ pendingCount, message }: { pendingCount: number; message?: string }) {
  if (!message && pendingCount === 0) return null

  return (
    <div className="fixed inset-x-3 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-2xl border border-white/10 bg-popover px-4 py-3 text-sm font-semibold text-popover-foreground shadow-lg lg:bottom-4 lg:left-auto lg:right-4 lg:mx-0">
      <p>{message || `${pendingCount} check-in${pendingCount === 1 ? '' : 's'} waiting to sync`}</p>
    </div>
  )
}
