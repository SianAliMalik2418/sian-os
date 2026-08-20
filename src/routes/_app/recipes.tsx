import { createFileRoute, useRouter } from '@tanstack/react-router'
import { MoreHorizontal, Minus, Pencil, Plus, Save, Search, Trash2, Utensils, X } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '@/components/ui/menu'
import { Textarea } from '@/components/ui/textarea'
import { getRecipesData } from '@/lib/app.functions'
import { nutritionEntryFromRecipe } from '@/lib/nutrition-entries'
import type { Recipe } from '@/lib/types'

export const Route = createFileRoute('/_app/recipes')({
  loader: () => getRecipesData(),
  component: RecipesPage,
})

const emptyValues = {
  name: '',
  aliases: '',
  category: '',
  serving_description: '',
  calories: '',
  protein_grams: '',
  fat_grams: '',
  carb_grams: '',
  ingredients: '',
  notes: '',
}

function RecipesPage() {
  const loadedRecipes = Route.useLoaderData()
  const router = useRouter()
  const [recipes, setRecipes] = useState(loadedRecipes)
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(emptyValues)
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [loggingRecipeId, setLoggingRecipeId] = useState<number | null>(null)
  const [status, setStatus] = useState<string>()
  const [error, setError] = useState<string>()

  const filteredRecipes = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return recipes
    return recipes.filter((recipe) => [recipe.name, recipe.aliases, recipe.category, recipe.ingredients].some((value) => value?.toLowerCase().includes(needle)))
  }, [query, recipes])

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function beginCreate() {
    setEditing(null)
    setValues(emptyValues)
    setStatus(undefined)
    setError(undefined)
    setFormOpen(true)
  }

  function beginEdit(recipe: Recipe) {
    setEditing(recipe)
    setValues(valuesFromRecipe(recipe))
    setStatus(undefined)
    setError(undefined)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setValues(emptyValues)
  }

  function setRecipeQuantity(recipeId: number, quantity: number) {
    setQuantities((current) => ({ ...current, [recipeId]: Math.max(0.25, Math.min(20, quantity)) }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatus(undefined)
    setError(undefined)

    const form = new FormData()
    for (const [key, value] of Object.entries(values)) form.set(key, value)

    try {
      const response = await fetch(editing ? `/api/recipes/${editing.id}` : '/api/recipes', { method: editing ? 'PUT' : 'POST', body: form })
      const result = await response.json() as { data?: Recipe; error?: { message?: string } }
      if (!response.ok || !result.data) throw new Error(result.error?.message || 'Could not save recipe')
      const saved = result.data
      setRecipes((current) => editing ? current.map((recipe) => recipe.id === saved.id ? saved : recipe) : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)))
      closeForm()
      setStatus('Recipe saved.')
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save recipe')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecipe(recipe: Recipe) {
    setError(undefined)
    setStatus(undefined)
    const response = await fetch(`/api/recipes/${recipe.id}`, { method: 'DELETE' })
    if (!response.ok) {
      const result = await response.json() as { error?: { message?: string } }
      setError(result.error?.message || 'Could not delete recipe')
      return
    }
    setRecipes((current) => current.filter((item) => item.id !== recipe.id))
    if (editing?.id === recipe.id) closeForm()
    setStatus('Recipe deleted.')
    await router.invalidate()
  }

  async function logRecipeToday(recipe: Recipe) {
    setError(undefined)
    setStatus(undefined)
    setLoggingRecipeId(recipe.id)
    const quantity = quantities[recipe.id] || 1
    const today = new Date().toISOString().slice(0, 10)

    try {
      const response = await fetch('/api/nutrition-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nutritionEntryFromRecipe(recipe, today, quantity)),
      })
      const result = await response.json() as { error?: { message?: string } }
      if (!response.ok) throw new Error(result.error?.message || 'Could not log recipe')
      setStatus(`${recipe.name}${quantity > 1 ? ` x${quantity}` : ''} logged for today.`)
      await router.invalidate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not log recipe')
    } finally {
      setLoggingRecipeId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Recipes</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Your repeat meals.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Save dishes, snacks, drinks, portions, ingredients, macros, and notes.</p>
        </div>
        <Button type="button" size="lg" onClick={beginCreate}><Plus /> New recipe</Button>
      </header>

      {status && <p role="status" className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">{status}</p>}
      {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}

      <section className="space-y-4">
        <div className="flex w-full items-center gap-2 rounded-xl border bg-secondary/25 px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <Input nativeInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes, aliases, ingredients…" className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
        </div>

        {filteredRecipes.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredRecipes.map((recipe) => {
              const quantity = quantities[recipe.id] || 1
              return (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  quantity={quantity}
                  logging={loggingRecipeId === recipe.id}
                  onQuantityChange={(nextQuantity) => setRecipeQuantity(recipe.id, nextQuantity)}
                  onLog={() => logRecipeToday(recipe)}
                  onEdit={() => beginEdit(recipe)}
                  onDelete={() => deleteRecipe(recipe)}
                />
              )
            })}
          </div>
        ) : (
          <Card>
            <CardPanel className="py-16 text-center">
              <Utensils className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="font-medium">No recipes found</p>
              <p className="mt-1 text-sm text-muted-foreground">Add repeat meals so nutrition logs can use known macros.</p>
            </CardPanel>
          </Card>
        )}
      </section>

      <RecipeFormDialog open={formOpen} editing={editing} values={values} saving={saving} onOpenChange={(open) => open ? setFormOpen(true) : closeForm()} onUpdate={update} onSubmit={submit} onCancel={closeForm} />
    </div>
  )
}

function RecipeCard({ recipe, quantity, logging, onQuantityChange, onLog, onEdit, onDelete }: {
  recipe: Recipe
  quantity: number
  logging: boolean
  onQuantityChange: (quantity: number) => void
  onLog: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="min-w-0 pr-2">
          <CardTitle>{recipe.name}</CardTitle>
          <CardDescription>{recipe.serving_description || recipe.category || 'Saved recipe'}</CardDescription>
        </div>
        <CardAction>
          <Menu>
            <MenuTrigger render={<Button type="button" variant="ghost" size="icon" aria-label={`${recipe.name} actions`} />}>
              <MoreHorizontal />
            </MenuTrigger>
            <MenuPopup align="end">
              <MenuItem onClick={onLog} disabled={logging}><Utensils /> Log today</MenuItem>
              <MenuItem onClick={onEdit}><Pencil /> Edit</MenuItem>
              <MenuSeparator />
              <MenuItem variant="destructive" onClick={onDelete}><Trash2 /> Delete</MenuItem>
            </MenuPopup>
          </Menu>
        </CardAction>
      </CardHeader>
      <CardPanel className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-secondary/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Badge variant="info">{recipe.protein_grams * quantity}g protein</Badge>
            <p className="text-xs text-muted-foreground">Macros shown for selected quantity.</p>
          </div>
          <div className="grid w-full grid-cols-[2.5rem_minmax(5rem,1fr)_2.5rem] items-center rounded-lg border bg-background p-1 sm:w-44" aria-label={`${recipe.name} quantity`}>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Decrease ${recipe.name} quantity`} onClick={() => onQuantityChange(quantity - 0.25)} disabled={quantity <= 0.25}><Minus /></Button>
            <Input nativeInput type="number" min="0.25" max="20" step="0.25" inputMode="decimal" aria-label={`${recipe.name} quantity value`} value={quantity} onChange={(event) => onQuantityChange(Number(event.target.value) || 1)} className="h-9 min-w-0 px-2 text-center text-sm tabular-nums" />
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Increase ${recipe.name} quantity`} onClick={() => onQuantityChange(quantity + 0.25)}><Plus /></Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Calories" value={`${recipe.calories * quantity} kcal`} />
          <Metric label="Protein" value={`${recipe.protein_grams * quantity} g`} />
          <Metric label="Fats" value={`${recipe.fat_grams * quantity} g`} />
          <Metric label="Carbs" value={`${recipe.carb_grams * quantity} g`} />
          <Metric label="Category" value={recipe.category || 'Not set'} />
        </div>
        {recipe.ingredients && <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{recipe.ingredients}</p>}
        {recipe.aliases && <p className="text-xs text-muted-foreground">Also: {recipe.aliases}</p>}
      </CardPanel>
    </Card>
  )
}

function RecipeFormDialog({ open, editing, values, saving, onOpenChange, onUpdate, onSubmit, onCancel }: {
  open: boolean
  editing: Recipe | null
  values: Record<string, string>
  saving: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (name: string, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <Form onSubmit={onSubmit} className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit recipe' : 'Add recipe'}</DialogTitle>
            <DialogDescription>Macros should match one normal serving.</DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-4">
            <RecipeField label="Name"><Input nativeInput required value={values.name} onChange={(event) => onUpdate('name', event.target.value)} placeholder="Chicken pulao" /></RecipeField>
            <RecipeField label="Aliases" description="Comma-separated names the agent may see">
              <Input nativeInput value={values.aliases} onChange={(event) => onUpdate('aliases', event.target.value)} placeholder="pulao, chicken rice" />
            </RecipeField>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <RecipeField label="Calories"><Input nativeInput required type="number" min="0" max="20000" step="1" inputMode="numeric" value={values.calories} onChange={(event) => onUpdate('calories', event.target.value)} /></RecipeField>
              <RecipeField label="Protein"><Input nativeInput required type="number" min="0" max="2000" step="1" inputMode="numeric" value={values.protein_grams} onChange={(event) => onUpdate('protein_grams', event.target.value)} /></RecipeField>
              <RecipeField label="Fats"><Input nativeInput type="number" min="0" max="2000" step="1" inputMode="numeric" value={values.fat_grams} onChange={(event) => onUpdate('fat_grams', event.target.value)} /></RecipeField>
              <RecipeField label="Carbs"><Input nativeInput type="number" min="0" max="2000" step="1" inputMode="numeric" value={values.carb_grams} onChange={(event) => onUpdate('carb_grams', event.target.value)} /></RecipeField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <RecipeField label="Serving"><Input nativeInput value={values.serving_description} onChange={(event) => onUpdate('serving_description', event.target.value)} placeholder="1 plate, 1 bowl, 2 pieces…" /></RecipeField>
              <RecipeField label="Category"><Input nativeInput value={values.category} onChange={(event) => onUpdate('category', event.target.value)} placeholder="Dish, snack, drink…" /></RecipeField>
            </div>
            <RecipeField label="Ingredients"><Textarea rows={5} value={values.ingredients} onChange={(event) => onUpdate('ingredients', event.target.value)} placeholder="Chicken, rice, oil, yogurt…" /></RecipeField>
            <RecipeField label="Notes"><Textarea rows={3} value={values.notes} onChange={(event) => onUpdate('notes', event.target.value)} placeholder="Usual portion, home version, restaurant version…" /></RecipeField>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>Cancel</DialogClose>
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}><X /> Clear</Button>
            <Button type="submit" loading={saving}><Save /> {editing ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-secondary/25 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-heading text-lg font-semibold">{value}</p></div>
}

function RecipeField({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return <Field><FieldLabel>{label}</FieldLabel>{children}{description && <FieldDescription>{description}</FieldDescription>}</Field>
}

function valuesFromRecipe(recipe: Recipe) {
  return {
    name: recipe.name,
    aliases: recipe.aliases || '',
    category: recipe.category || '',
    serving_description: recipe.serving_description || '',
    calories: String(recipe.calories),
    protein_grams: String(recipe.protein_grams),
    fat_grams: String(recipe.fat_grams),
    carb_grams: String(recipe.carb_grams),
    ingredients: recipe.ingredients || '',
    notes: recipe.notes || '',
  }
}
