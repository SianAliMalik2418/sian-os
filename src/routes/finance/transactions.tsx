import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Save, Trash2 } from 'lucide-react'
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
import { getFinanceTransactionsData } from '@/lib/app.functions'
import type { FinanceTransactionInput } from '@/lib/schemas'
import type { FinanceTransaction } from '@/lib/types'

export const Route = createFileRoute('/finance/transactions')({ loader: () => getFinanceTransactionsData(), component: TransactionsPage })

const today = () => new Date().toISOString().slice(0, 10)

function money(value: number) {
  return `£${value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
}

type ApiErrorResult = { error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } }

function errorMessageFrom(result: ApiErrorResult, fallback: string) {
  const fieldErrors = result.error?.details?.fieldErrors
  const entries = fieldErrors ? Object.entries(fieldErrors).filter(([, messages]) => messages.length) : []
  if (entries.length) return entries.map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('; ')
  return result.error?.message || fallback
}

function TransactionsPage() {
  const { transactions: initial, categories } = Route.useLoaderData()
  const router = useRouter()
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initial)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [date, setDate] = useState(today())
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [deleteTarget, setDeleteTarget] = useState<FinanceTransaction>()
  const [deleting, setDeleting] = useState(false)

  const categoryName = (id: number | null) => categories.find((category) => category.id === id)?.name ?? '—'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(undefined)
    const payload: FinanceTransactionInput = {
      date,
      type,
      amount: Number(amount),
      ...(categoryId ? { category_id: Number(categoryId) } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    }
    try {
      const response = await fetch('/api/finance/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json() as { data?: FinanceTransaction } & ApiErrorResult
      if (!response.ok || !result.data) throw new Error(errorMessageFrom(result, 'Could not save transaction'))
      setTransactions((current) => [result.data!, ...current])
      setAmount('')
      setNote('')
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save transaction')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/finance/transactions/${deleteTarget.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete transaction')
      setTransactions((current) => current.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(undefined)
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete transaction')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Page>
      <PageHeader kicker="Finance" title="Transactions" description="Log income and spending." illustration="reports" />

      <Form onSubmit={submit} className="rise grid gap-4 rounded-[1.8rem] border border-white/8 bg-card p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select value={type} onValueChange={(value) => value && setType(value as 'income' | 'expense')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Date</FieldLabel>
            <DatePicker value={date} onValueChange={setDate} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Amount (£)</FieldLabel>
            <Input nativeInput type="number" min="0.01" step="0.01" inputMode="decimal" required value={amount} onChange={(event) => setAmount(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Category</FieldLabel>
            <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? '')}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                {categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel>Note</FieldLabel>
          <Textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" />
        </Field>
        {error && <p role="alert" className="rounded-2xl bg-destructive/12 px-4 py-3 text-sm font-semibold text-destructive-foreground">{error}</p>}
        <Button type="submit" loading={saving} className="h-11 w-fit rounded-full px-6 font-extrabold"><Save /> Save transaction</Button>
      </Form>

      <section className="space-y-3">
        <SectionTitle title="History" meta={`${transactions.length} entries`} />
        {transactions.length ? (
          <div className="grid gap-2.5">
            {transactions.map((entry) => (
              <article key={entry.id} className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/8 bg-card p-4">
                <div className="min-w-0">
                  <p className="font-extrabold text-cream">{entry.note || categoryName(entry.category_id)}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{entry.date} · {categoryName(entry.category_id)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-extrabold tabular-nums ${entry.type === 'income' ? 'text-mint' : 'text-cream'}`}>{entry.type === 'income' ? '+' : '−'}{money(entry.amount)}</p>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => setDeleteTarget(entry)} aria-label="Delete transaction" className="text-destructive-foreground"><Trash2 /></Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Notice tone="status">No transactions logged yet.</Notice>
        )}
      </section>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete transaction?"
        description="This permanently removes this entry."
        confirmLabel="Delete transaction"
        deleting={deleting}
        onConfirm={confirmDelete}
      />
    </Page>
  )
}
