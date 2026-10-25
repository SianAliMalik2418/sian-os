import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Check, Save, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Notice, Page, PageHeader, SectionTitle } from '@/components/sunrise/primitives'
import { getFinanceDebtsData } from '@/lib/app.functions'
import { formatMoney as money } from '@/lib/finance-format'
import type { FinanceDebtInput } from '@/lib/schemas'
import type { FinanceDebt } from '@/lib/types'

export const Route = createFileRoute('/finance/debts')({ loader: () => getFinanceDebtsData(), component: DebtsPage })

type ApiErrorResult = { error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } }

function errorMessageFrom(result: ApiErrorResult, fallback: string) {
  const fieldErrors = result.error?.details?.fieldErrors
  const entries = fieldErrors ? Object.entries(fieldErrors).filter(([, messages]) => messages.length) : []
  if (entries.length) return entries.map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('; ')
  return result.error?.message || fallback
}

function DebtsPage() {
  const initial = Route.useLoaderData()
  const router = useRouter()
  const [debts, setDebts] = useState<FinanceDebt[]>(initial)
  const [counterparty, setCounterparty] = useState('')
  const [direction, setDirection] = useState<'owed_by_me' | 'owed_to_me'>('owed_by_me')
  const [principal, setPrincipal] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [deleteTarget, setDeleteTarget] = useState<FinanceDebt>()
  const [deleting, setDeleting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(undefined)
    const payload: FinanceDebtInput = {
      counterparty,
      direction,
      principal: Number(principal),
      ...(dueDate ? { due_date: dueDate } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    }
    try {
      const response = await fetch('/api/finance/debts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json() as { data?: FinanceDebt } & ApiErrorResult
      if (!response.ok || !result.data) throw new Error(errorMessageFrom(result, 'Could not save debt'))
      setDebts((current) => [result.data!, ...current])
      setCounterparty('')
      setPrincipal('')
      setDueDate('')
      setNote('')
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save debt')
    } finally {
      setSaving(false)
    }
  }

  async function markPaid(debt: FinanceDebt) {
    setError(undefined)
    try {
      const response = await fetch(`/api/finance/debts/${debt.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ balance: 0, status: 'paid' }) })
      const result = await response.json() as { data?: FinanceDebt } & ApiErrorResult
      if (!response.ok || !result.data) throw new Error(errorMessageFrom(result, 'Could not update debt'))
      setDebts((current) => current.map((item) => item.id === debt.id ? result.data! : item))
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update debt')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/finance/debts/${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete debt')
      setDebts((current) => current.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(undefined)
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete debt')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Page>
      <PageHeader kicker="Finance" title="Borrowed & lent" description="Track what you owe and what's owed to you." illustration="reports" />

      <Form onSubmit={submit} className="rise grid gap-4 rounded-[1.8rem] border border-white/8 bg-card p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Who</FieldLabel>
            <Input nativeInput required value={counterparty} onChange={(event) => setCounterparty(event.target.value)} placeholder="e.g. Bro Imran" />
          </Field>
          <Field>
            <FieldLabel>Direction</FieldLabel>
            <Select value={direction} onValueChange={(value) => value && setDirection(value as typeof direction)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="owed_by_me">I owe them</SelectItem>
                <SelectItem value="owed_to_me">They owe me</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Amount (Rs)</FieldLabel>
            <Input nativeInput type="number" min="0.01" step="0.01" inputMode="decimal" required value={principal} onChange={(event) => setPrincipal(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Due date</FieldLabel>
            <DatePicker value={dueDate} onValueChange={setDueDate} />
          </Field>
        </div>
        <Field>
          <FieldLabel>Note</FieldLabel>
          <Textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" />
        </Field>
        {error && <p role="alert" className="rounded-2xl bg-destructive/12 px-4 py-3 text-sm font-semibold text-destructive-foreground">{error}</p>}
        <Button type="submit" loading={saving} className="h-11 w-fit rounded-full px-6 font-extrabold"><Save /> Save debt</Button>
      </Form>

      <section className="space-y-3">
        <SectionTitle title="All debts" meta={`${debts.length} total`} />
        {debts.length ? (
          <div className="grid gap-2.5">
            {debts.map((debt) => (
              <article key={debt.id} className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/8 bg-card p-4">
                <div className="min-w-0">
                  <p className="font-extrabold text-cream">{debt.counterparty}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{debt.direction === 'owed_by_me' ? 'You owe' : 'Owed to you'} · {debt.status}{debt.due_date ? ` · due ${debt.due_date}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-extrabold text-cream tabular-nums">{money(debt.balance)}</p>
                  {debt.status === 'outstanding' && <Button type="button" size="icon-sm" variant="ghost" onClick={() => markPaid(debt)} aria-label="Mark as paid"><Check /></Button>}
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => setDeleteTarget(debt)} aria-label="Delete debt" className="text-destructive-foreground"><Trash2 /></Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Notice tone="status">No debts logged.</Notice>
        )}
      </section>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete debt?"
        description="This permanently removes this record."
        confirmLabel="Delete debt"
        deleting={deleting}
        onConfirm={confirmDelete}
      />
    </Page>
  )
}
