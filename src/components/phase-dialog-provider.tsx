import { useRouter } from '@tanstack/react-router'
import { Save } from 'lucide-react'
import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { GoalPhaseInput } from '@/lib/schemas'
import type { GoalPhase } from '@/lib/types'

const today = () => new Date().toISOString().slice(0, 10)

const phaseLabels: Record<string, string> = {
  lean_gain: 'Lean gain',
  bulk: 'Bulk',
  cut: 'Cut',
  recomp: 'Recomp',
  maintain: 'Maintain',
}

const phaseOptions = Object.entries(phaseLabels)

type Values = { phase_type: string; target_rate_kg_per_week: string; note: string; started_at: string }

function emptyValues(): Values {
  return { phase_type: 'lean_gain', target_rate_kg_per_week: '', note: '', started_at: today() }
}

type ApiErrorResult = { error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } }

function errorMessageFrom(result: ApiErrorResult, fallback: string) {
  const fieldErrors = result.error?.details?.fieldErrors
  const entries = fieldErrors ? Object.entries(fieldErrors).filter(([, messages]) => messages.length) : []
  if (entries.length) return entries.map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('; ')
  return result.error?.message || fallback
}

const PhaseDialogContext = createContext<{ openPhaseDialog: () => void } | null>(null)

export function useChangePhaseDialog() {
  const context = useContext(PhaseDialogContext)
  if (!context) throw new Error('useChangePhaseDialog must be used inside PhaseDialogProvider')
  return context
}

export function PhaseDialogProvider({ onPhaseStarted, children }: { onPhaseStarted?: (phase: GoalPhase) => void; children: ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Values>(emptyValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  function openPhaseDialog() {
    setValues(emptyValues())
    setError(undefined)
    setOpen(true)
  }

  function update(name: keyof Values, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(undefined)

    const payload: GoalPhaseInput = {
      phase_type: values.phase_type as GoalPhaseInput['phase_type'],
      started_at: values.started_at,
      ...(values.target_rate_kg_per_week !== '' ? { target_rate_kg_per_week: Number(values.target_rate_kg_per_week) } : {}),
      ...(values.note.trim() ? { note: values.note.trim() } : {}),
    }

    try {
      const response = await fetch('/api/goal-phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json() as { data?: GoalPhase } & ApiErrorResult
      if (!response.ok || !result.data) throw new Error(errorMessageFrom(result, 'Could not start phase'))
      setOpen(false)
      onPhaseStarted?.(result.data)
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not start phase')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PhaseDialogContext.Provider value={{ openPhaseDialog }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup className="max-w-lg">
          <Form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Start a new phase</DialogTitle>
              <DialogDescription>Closes the current active phase and starts this one from the date below.</DialogDescription>
            </DialogHeader>

            <DialogPanel className="grid grid-cols-1 gap-4">
              <Field>
                <FieldLabel>Phase type</FieldLabel>
                <Select value={values.phase_type} onValueChange={(value) => value && update('phase_type', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {phaseOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Weekly target</FieldLabel>
                <Input nativeInput type="number" min="-5" max="5" step="0.1" inputMode="decimal" placeholder="-0.5 for a cut, 0.3 for a gain" value={values.target_rate_kg_per_week} onChange={(event) => update('target_rate_kg_per_week', event.target.value)} />
                <FieldDescription>Kilograms per week. Negative loses weight, positive gains it. Leave blank for no numeric target.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Start date</FieldLabel>
                <DatePicker value={values.started_at} onValueChange={(value) => update('started_at', value)} required />
              </Field>

              <Field>
                <FieldLabel>Note</FieldLabel>
                <Textarea rows={3} value={values.note} onChange={(event) => update('note', event.target.value)} placeholder="Why this phase, if useful later" />
              </Field>

              {error && <p role="alert" className="rounded-2xl bg-destructive/12 px-4 py-3 text-sm font-semibold text-destructive-foreground">{error}</p>}
            </DialogPanel>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" className="rounded-full px-5 font-bold" />}>Cancel</DialogClose>
              <Button type="submit" loading={saving} className="h-11 rounded-full px-6 font-extrabold"><Save /> Start phase</Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>
    </PhaseDialogContext.Provider>
  )
}

export { phaseLabels }
