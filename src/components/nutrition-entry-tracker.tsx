import { Plus, Trash2, Utensils } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { groupedNutritionEntries } from '@/lib/nutrition-entries'
import type { DailyCheckin, NutritionEntry } from '@/lib/types'

export function NutritionEntryTracker({ date, initialEntries, calorieGoal, proteinGoal, compact = false, onCheckinChange }: {
  date: string
  initialEntries?: NutritionEntry[]
  calorieGoal: number
  proteinGoal: number
  compact?: boolean
  onCheckinChange?: (checkin: DailyCheckin) => void
}) {
  const [entries, setEntries] = useState(initialEntries || [])
  const [itemName, setItemName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [fats, setFats] = useState('')
  const [carbs, setCarbs] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [addOpen, setAddOpen] = useState(false)

  const calorieTotal = entries.reduce((total, entry) => total + entry.calories, 0)
  const proteinTotal = entries.reduce((total, entry) => total + entry.protein_grams, 0)
  const fatTotal = entries.reduce((total, entry) => total + entry.fat_grams, 0)
  const carbTotal = entries.reduce((total, entry) => total + entry.carb_grams, 0)

  useEffect(() => {
    let isCurrent = true
    async function loadEntries() {
      setError(undefined)
      const response = await fetch(`/api/nutrition-entries?date=${encodeURIComponent(date)}`)
      const result = await response.json() as { data?: NutritionEntry[]; error?: { message?: string } }
      if (!isCurrent) return
      if (!response.ok || !result.data) {
        setError(result.error?.message || 'Could not load food items')
        return
      }
      setEntries(result.data)
    }

    if (initialEntries) {
      setEntries(initialEntries)
      return
    }
    void loadEntries()
    return () => {
      isCurrent = false
    }
  }, [date, initialEntries])

  async function addEntry() {
    const parsedCalories = Number(calories)
    const parsedProtein = protein === '' ? 0 : Number(protein)
    const parsedFats = fats === '' ? 0 : Number(fats)
    const parsedCarbs = carbs === '' ? 0 : Number(carbs)
    if (!itemName.trim()) {
      setError('Enter the food item')
      return
    }
    if (!Number.isFinite(parsedCalories) || parsedCalories < 0) {
      setError('Enter valid calories')
      return
    }
    if (!Number.isFinite(parsedProtein) || parsedProtein < 0) {
      setError('Enter valid protein')
      return
    }
    if (!Number.isFinite(parsedFats) || parsedFats < 0) {
      setError('Enter valid fats')
      return
    }
    if (!Number.isFinite(parsedCarbs) || parsedCarbs < 0) {
      setError('Enter valid carbs')
      return
    }

    setSaving(true)
    setError(undefined)
    try {
      const response = await fetch('/api/nutrition-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          item_name: itemName.trim(),
          calories: Math.round(parsedCalories),
          protein_grams: Math.round(parsedProtein),
          fat_grams: Math.round(parsedFats),
          carb_grams: Math.round(parsedCarbs),
        }),
      })
      const result = await response.json() as { data?: { entry?: NutritionEntry; checkin?: DailyCheckin }; error?: { message?: string } }
      const saved = result.data
      if (!response.ok || !saved?.entry || !saved.checkin) throw new Error(result.error?.message || 'Could not save food item')
      const { entry, checkin } = saved
      setEntries((current) => [...current, entry])
      onCheckinChange?.(checkin)
      setItemName('')
      setCalories('')
      setProtein('')
      setFats('')
      setCarbs('')
      if (!compact) setAddOpen(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save food item')
    } finally {
      setSaving(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await addEntry()
  }

  async function deleteEntry(entryId: number, itemName: string) {
    setSaving(true)
    setError(undefined)
    try {
      const response = await fetch(`/api/nutrition-entries/${entryId}`, { method: 'DELETE' })
      const result = await response.json() as { data?: { checkin?: DailyCheckin }; error?: { message?: string } }
      if (!response.ok || !result.data?.checkin) throw new Error(result.error?.message || 'Could not delete food item')
      setEntries((current) => current.filter((item) => item.id !== entryId))
      onCheckinChange?.(result.data.checkin)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Could not delete ${itemName}`)
    } finally {
      setSaving(false)
    }
  }

  function openAddDialog() {
    setError(undefined)
    setAddOpen(true)
  }

  const entryFields = <NutritionEntryFields itemName={itemName} calories={calories} protein={protein} fats={fats} carbs={carbs} onItemNameChange={setItemName} onCaloriesChange={setCalories} onProteinChange={setProtein} onFatsChange={setFats} onCarbsChange={setCarbs} />
  const groupedEntries = groupedNutritionEntries(entries)

  const body = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NutritionTotal label="Calories" value={calorieTotal} goal={calorieGoal} unit="kcal" />
        <NutritionTotal label="Protein" value={proteinTotal} goal={proteinGoal} unit="g" />
        <NutritionTotal label="Fats" value={fatTotal} unit="g" />
        <NutritionTotal label="Carbs" value={carbTotal} unit="g" />
      </div>

      {compact ? (
        <div className="grid gap-3 lg:grid-cols-[1fr_7rem_7rem_7rem_7rem_auto]">
          {entryFields}
          <Button type="button" loading={saving} className="self-end" onClick={addEntry}>Add</Button>
        </div>
      ) : null}

      {groupedEntries.length ? (
        <div className="divide-y rounded-lg border">
          {groupedEntries.map((entry) => (
            <div key={entry.ids.join('-')} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{entry.item_name}{entry.quantity > 1 ? ` x${entry.quantity}` : ''}</p>
                <p className="text-muted-foreground">{entry.calories} kcal · {entry.protein_grams} g protein · {entry.fat_grams} g fat · {entry.carb_grams} g carbs</p>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label={`Delete one ${entry.item_name}`} onClick={() => deleteEntry(entry.ids.at(-1) ?? entry.ids[0], entry.item_name)} disabled={saving}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
      ) : <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">No food items added yet.</p>}

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}
    </div>
  )

  if (compact) return body

  return (
    <>
      <Card>
        <CardHeader>
          <div><CardTitle>Nutrition</CardTitle><CardDescription>Food items for today</CardDescription></div>
          <CardAction>
            <Button type="button" size="sm" onClick={openAddDialog}><Plus /> Add food</Button>
          </CardAction>
        </CardHeader>
        <CardPanel>{body}</CardPanel>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogPopup className="max-w-xl">
          <Form onSubmit={submit} className="flex min-h-0 flex-col">
            <DialogHeader>
              <DialogTitle>Add food</DialogTitle>
              <DialogDescription>Record one item with calories and macros for today.</DialogDescription>
            </DialogHeader>
            <DialogPanel className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">{entryFields}</div>
              {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}
            </DialogPanel>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" loading={saving}><Utensils /> Save food</Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>
    </>
  )
}

function NutritionEntryFields({ itemName, calories, protein, fats, carbs, onItemNameChange, onCaloriesChange, onProteinChange, onFatsChange, onCarbsChange }: {
  itemName: string
  calories: string
  protein: string
  fats: string
  carbs: string
  onItemNameChange: (value: string) => void
  onCaloriesChange: (value: string) => void
  onProteinChange: (value: string) => void
  onFatsChange: (value: string) => void
  onCarbsChange: (value: string) => void
}) {
  return (
    <>
      <Field><FieldLabel>Item</FieldLabel><Input nativeInput value={itemName} onChange={(event) => onItemNameChange(event.target.value)} placeholder="Egg" /></Field>
      <Field><FieldLabel>Calories</FieldLabel><Input nativeInput type="number" min="0" step="1" inputMode="numeric" value={calories} onChange={(event) => onCaloriesChange(event.target.value)} placeholder="100" /></Field>
      <Field><FieldLabel>Protein</FieldLabel><Input nativeInput type="number" min="0" step="1" inputMode="numeric" value={protein} onChange={(event) => onProteinChange(event.target.value)} placeholder="6" /></Field>
      <Field><FieldLabel>Fats</FieldLabel><Input nativeInput type="number" min="0" step="1" inputMode="numeric" value={fats} onChange={(event) => onFatsChange(event.target.value)} placeholder="5" /></Field>
      <Field><FieldLabel>Carbs</FieldLabel><Input nativeInput type="number" min="0" step="1" inputMode="numeric" value={carbs} onChange={(event) => onCarbsChange(event.target.value)} placeholder="1" /></Field>
    </>
  )
}

function NutritionTotal({ label, value, goal, unit }: { label: string; value: number; goal?: number; unit: string }) {
  const remaining = goal === undefined ? undefined : Math.max(goal - value, 0)
  const progress = goal && goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-semibold tabular-nums">{value}<span className="ml-1 text-sm text-muted-foreground">{unit}</span></p>
        </div>
        {remaining !== undefined && <Badge variant={remaining === 0 ? 'success' : 'info'}>{remaining} left</Badge>}
      </div>
      {goal !== undefined ? <><Progress value={progress} /><p className="mt-2 text-xs text-muted-foreground">{goal} {unit} goal</p></> : <p className="text-xs text-muted-foreground">From food items</p>}
    </div>
  )
}
