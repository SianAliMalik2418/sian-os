import { useRouter } from '@tanstack/react-router'
import { Camera, Check, Clock3, Save, Trash2 } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { calculateSleepHours } from '@/lib/metrics'
import { queueCheckin, readQueuedCheckins, syncQueuedCheckins } from '@/lib/offline-checkins'
import type { CheckinInput } from '@/lib/schemas'
import type { DailyCheckin, ProgressPhoto } from '@/lib/types'

const numericFields = ['weight_kg', 'water_liters', 'protein_grams', 'calories'] as const
const nutritionTemplate = 'Breakfast:\nLunch:\nDinner:'
const today = () => new Date().toISOString().slice(0, 10)

const DailyCheckinDialogContext = createContext<{ openCheckin: (date?: string) => void } | null>(null)

export function useDailyCheckinDialog() {
  const context = useContext(DailyCheckinDialogContext)
  if (!context) throw new Error('useDailyCheckinDialog must be used inside DailyCheckinDialogProvider')
  return context
}

export function DailyCheckinDialogProvider({ existing, photos, children }: { existing: DailyCheckin | null; photos: ProgressPhoto[]; children: ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DailyCheckin | null>(existing)
  const [values, setValues] = useState<Record<string, string>>(() => valuesFromCheckin(existing))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoLabel, setPhotoLabel] = useState('')
  const [photoDeleteId, setPhotoDeleteId] = useState<number>()
  const [error, setError] = useState<string>()
  const [syncMessage, setSyncMessage] = useState<string>()
  const [pendingCount, setPendingCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

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

  const sleepHours = useMemo(() => {
    if (!/^\d{2}:\d{2}$/.test(values.sleep_time || '') || !/^\d{2}:\d{2}$/.test(values.wake_time || '')) return null
    return calculateSleepHours(values.sleep_time, values.wake_time)
  }, [values.sleep_time, values.wake_time])

  const selectedPhotos = useMemo(
    () => photos.filter((photo) => photo.date === values.date),
    [photos, values.date],
  )

  async function openCheckin(date = today()) {
    setOpen(true)
    setError(undefined)
    setSyncMessage(undefined)
    setPhotoLabel('')
    if (fileRef.current) fileRef.current.value = ''

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(undefined)
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

  async function uploadPhoto() {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Choose a photo to upload')
      return
    }
    setPhotoSaving(true)
    setError(undefined)
    const form = new FormData()
    form.set('date', values.date)
    form.set('label', photoLabel)
    form.set('photo', file)

    try {
      const response = await fetch('/api/progress-photos', { method: 'POST', body: form })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not upload photo')
      setPhotoLabel('')
      if (fileRef.current) fileRef.current.value = ''
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not upload photo')
    } finally {
      setPhotoSaving(false)
    }
  }

  async function deletePhoto(id: number) {
    setError(undefined)
    const response = await fetch(`/api/progress-photos/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      const result = await response.json() as { error?: { message?: string } }
      setError(result.error?.message || 'Could not delete photo')
      return
    }
    setPhotoDeleteId(undefined)
    await router.invalidate()
  }

  return (
    <DailyCheckinDialogContext.Provider value={{ openCheckin }}>
      {children}
      <OfflineSyncStatus pendingCount={pendingCount} message={syncMessage} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup className="h-[min(52rem,calc(100dvh-2rem))] max-w-2xl max-sm:h-[calc(100dvh-3rem)]">
          <Form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle>{editing ? 'Edit daily check-in' : 'Daily check-in'}</DialogTitle>
                {editing && <Badge variant="success"><Check /> Saved</Badge>}
                {pendingCount > 0 && <Badge variant="warning">{pendingCount} offline</Badge>}
              </div>
              <DialogDescription>Log wellness, meals, and progress photos for one day.</DialogDescription>
            </DialogHeader>

            <DialogPanel className="grid gap-5">
              {loading && <p className="text-sm text-muted-foreground">Loading check-in…</p>}

              <div className="grid gap-4 sm:grid-cols-2">
                <CheckinField label="Date">
                  <DatePicker value={values.date} onValueChange={openCheckin} required />
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
                <CheckinField label="Calories" description="Estimated kcal">
                  <Input nativeInput type="number" min="0" step="1" inputMode="numeric" placeholder="2400" value={values.calories || ''} onChange={(event) => update('calories', event.target.value)} />
                </CheckinField>
              </div>

              <CheckinField label="Nutrition" description="Add meals or a simple food summary">
                <Textarea value={values.nutrition_notes || ''} onChange={(event) => update('nutrition_notes', event.target.value)} rows={6} />
              </CheckinField>

              <CheckinField label="Workout" description="Reviewer-facing notes; detailed workouts stay in Lyfta">
                <Textarea value={values.workout_text || ''} onChange={(event) => update('workout_text', event.target.value)} placeholder="Lyfta workout name, exercises, sets, notes…" rows={4} />
              </CheckinField>

              <CheckinField label="Notes" description="Optional context for appetite, aches, energy, or schedule changes">
                <Textarea value={values.notes || ''} onChange={(event) => update('notes', event.target.value)} placeholder="Anything else worth remembering today…" rows={4} />
              </CheckinField>

              <section className="rounded-2xl border p-4">
                <div className="mb-4"><p className="font-heading font-semibold">Progress photos</p><p className="mt-1 text-xs text-muted-foreground">Photos use the selected check-in date.</p></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CheckinField label="Photo"><Input ref={fileRef} nativeInput type="file" accept="image/*" /></CheckinField>
                  <CheckinField label="Label"><Input nativeInput value={photoLabel} onChange={(event) => setPhotoLabel(event.target.value)} placeholder="Front, side, month 3…" /></CheckinField>
                </div>
                <Button type="button" variant="outline" className="mt-3" loading={photoSaving} onClick={uploadPhoto}><Camera /> Upload photo</Button>
                {selectedPhotos.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{selectedPhotos.map((photo) => <figure key={photo.id} className="group relative overflow-hidden rounded-xl border bg-secondary"><img src={`/api/progress-photos/${photo.id}`} alt={photo.label || `Progress photo ${photo.date}`} className="aspect-[3/4] w-full object-cover" loading="lazy" /><figcaption className="p-2"><p className="truncate text-xs font-medium">{photo.label || 'Progress'}</p></figcaption><button type="button" onClick={() => setPhotoDeleteId(photo.id)} className="absolute right-2 top-2 rounded-lg bg-background/80 p-2 opacity-100 backdrop-blur sm:opacity-0 sm:transition sm:group-hover:opacity-100" aria-label="Delete photo"><Trash2 className="size-4" /></button></figure>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No photos for this date.</p>}
              </section>

              {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}
              {syncMessage && <p role="status" className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">{syncMessage}</p>}
            </DialogPanel>

            <DialogFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" loading={saving} disabled={loading}><Save /> {editing ? 'Save changes' : 'Save check-in'}</Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>

      <Dialog open={Boolean(photoDeleteId)} onOpenChange={(nextOpen) => !nextOpen && setPhotoDeleteId(undefined)}>
        <DialogPopup className="max-w-md">
          <DialogHeader><DialogTitle>Delete progress photo?</DialogTitle><DialogDescription>The original image and its metadata will be permanently removed.</DialogDescription></DialogHeader>
          <DialogPanel><p className="text-sm text-muted-foreground">This action cannot be undone.</p></DialogPanel>
          <DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button type="button" variant="destructive" onClick={() => photoDeleteId && deletePhoto(photoDeleteId)}><Trash2 /> Delete photo</Button></DialogFooter>
        </DialogPopup>
      </Dialog>
    </DailyCheckinDialogContext.Provider>
  )
}

function isOfflineSave(error: unknown) {
  return (typeof navigator !== 'undefined' && !navigator.onLine) || error instanceof TypeError
}

function valuesFromCheckin(existing: DailyCheckin | null, date = today()) {
  const values: Record<string, string> = { date, nutrition_notes: nutritionTemplate }
  if (!existing) return values
  for (const [key, value] of Object.entries(existing)) {
    if (value !== null && value !== undefined && !['id', 'created_at', 'updated_at', 'sleep_hours'].includes(key)) values[key] = String(value)
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
    <div className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg lg:bottom-4 lg:left-auto lg:right-4 lg:mx-0">
      <p>{message || `${pendingCount} check-in${pendingCount === 1 ? '' : 's'} waiting to sync`}</p>
    </div>
  )
}
