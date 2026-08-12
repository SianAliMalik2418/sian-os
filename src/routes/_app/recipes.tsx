import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ImageIcon, Pencil, Plus, Save, Search, Trash2, Utensils, X } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getRecipesData } from '@/lib/app.functions'
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
  ingredients: '',
  notes: '',
}

function RecipesPage() {
  const loadedRecipes = Route.useLoaderData()
  const router = useRouter()
  const [recipes, setRecipes] = useState(loadedRecipes)
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [values, setValues] = useState<Record<string, string>>(emptyValues)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string>()
  const [error, setError] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)

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
    if (fileRef.current) fileRef.current.value = ''
  }

  function beginEdit(recipe: Recipe) {
    setEditing(recipe)
    setValues(valuesFromRecipe(recipe))
    setStatus(undefined)
    setError(undefined)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatus(undefined)
    setError(undefined)

    const form = new FormData()
    for (const [key, value] of Object.entries(values)) form.set(key, value)
    const photo = fileRef.current?.files?.[0]
    if (photo) form.set('photo', photo)

    try {
      const response = await fetch(editing ? `/api/recipes/${editing.id}` : '/api/recipes', { method: editing ? 'PUT' : 'POST', body: form })
      const result = await response.json() as { data?: Recipe; error?: { message?: string } }
      if (!response.ok || !result.data) throw new Error(result.error?.message || 'Could not save recipe')
      const saved = result.data
      setRecipes((current) => editing ? current.map((recipe) => recipe.id === saved.id ? saved : recipe) : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)))
      setEditing(null)
      setValues(emptyValues)
      if (fileRef.current) fileRef.current.value = ''
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
    if (editing?.id === recipe.id) {
      setEditing(null)
      setValues(emptyValues)
    }
    setStatus('Recipe deleted.')
    await router.invalidate()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">Recipes</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Your repeat meals.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Save dishes, snacks, drinks, portions, ingredients, calories, protein, and photos.</p>
        </div>
        <Button type="button" size="lg" onClick={beginCreate}><Plus /> New recipe</Button>
      </header>

      {status && <p role="status" className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">{status}</p>}
      {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border bg-secondary/25 px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <Input nativeInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes, aliases, ingredients…" className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
          </div>

          {filteredRecipes.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onEdit={() => beginEdit(recipe)} onDelete={() => deleteRecipe(recipe)} />)}
            </div>
          ) : (
            <Card>
              <CardPanel className="py-16 text-center">
                <Utensils className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="font-medium">No recipes found</p>
                <p className="mt-1 text-sm text-muted-foreground">Add repeat meals so nutrition logs can use known calories and protein.</p>
              </CardPanel>
            </Card>
          )}
        </section>

        <RecipeForm editing={editing} values={values} saving={saving} fileRef={fileRef} onUpdate={update} onSubmit={submit} onCancel={() => { setEditing(null); setValues(emptyValues) }} />
      </div>
    </div>
  )
}

function RecipeCard({ recipe, onEdit, onDelete }: { recipe: Recipe; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="overflow-hidden">
      {recipe.photo_r2_key ? <img src={`/api/recipes/${recipe.id}/photo`} alt={recipe.name} className="aspect-video w-full object-cover" loading="lazy" /> : <div className="flex aspect-video items-center justify-center bg-secondary/40"><ImageIcon className="size-8 text-muted-foreground" /></div>}
      <CardHeader>
        <div>
          <CardTitle>{recipe.name}</CardTitle>
          <CardDescription>{recipe.serving_description || recipe.category || 'Saved recipe'}</CardDescription>
        </div>
        <CardAction><Badge variant="info">{recipe.protein_grams}g protein</Badge></CardAction>
      </CardHeader>
      <CardPanel className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Calories" value={`${recipe.calories} kcal`} />
          <Metric label="Category" value={recipe.category || 'Not set'} />
        </div>
        {recipe.ingredients && <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{recipe.ingredients}</p>}
        {recipe.aliases && <p className="text-xs text-muted-foreground">Also: {recipe.aliases}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onEdit}><Pencil /> Edit</Button>
          <Button type="button" variant="destructive" onClick={onDelete}><Trash2 /> Delete</Button>
        </div>
      </CardPanel>
    </Card>
  )
}

function RecipeForm({ editing, values, saving, fileRef, onUpdate, onSubmit, onCancel }: {
  editing: Recipe | null
  values: Record<string, string>
  saving: boolean
  fileRef: RefObject<HTMLInputElement | null>
  onUpdate: (name: string, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}) {
  return (
    <Form onSubmit={onSubmit} className="sticky top-20 h-fit space-y-4 rounded-xl border bg-card p-4 text-card-foreground">
      <div>
        <p className="font-heading text-xl font-semibold">{editing ? 'Edit recipe' : 'Add recipe'}</p>
        <p className="mt-1 text-sm text-muted-foreground">Calories and protein should match one normal serving.</p>
      </div>
      <RecipeField label="Name"><Input nativeInput required value={values.name} onChange={(event) => onUpdate('name', event.target.value)} placeholder="Chicken pulao" /></RecipeField>
      <RecipeField label="Aliases" description="Comma-separated names the agent may see">
        <Input nativeInput value={values.aliases} onChange={(event) => onUpdate('aliases', event.target.value)} placeholder="pulao, chicken rice" />
      </RecipeField>
      <div className="grid grid-cols-2 gap-3">
        <RecipeField label="Calories"><Input nativeInput required type="number" min="0" max="20000" step="1" inputMode="numeric" value={values.calories} onChange={(event) => onUpdate('calories', event.target.value)} /></RecipeField>
        <RecipeField label="Protein"><Input nativeInput required type="number" min="0" max="2000" step="1" inputMode="numeric" value={values.protein_grams} onChange={(event) => onUpdate('protein_grams', event.target.value)} /></RecipeField>
      </div>
      <RecipeField label="Serving"><Input nativeInput value={values.serving_description} onChange={(event) => onUpdate('serving_description', event.target.value)} placeholder="1 plate, 1 bowl, 2 pieces…" /></RecipeField>
      <RecipeField label="Category"><Input nativeInput value={values.category} onChange={(event) => onUpdate('category', event.target.value)} placeholder="Dish, snack, drink…" /></RecipeField>
      <RecipeField label="Ingredients"><Textarea rows={5} value={values.ingredients} onChange={(event) => onUpdate('ingredients', event.target.value)} placeholder="Chicken, rice, oil, yogurt…" /></RecipeField>
      <RecipeField label="Photo"><Input ref={fileRef} nativeInput type="file" accept="image/*" /></RecipeField>
      <RecipeField label="Notes"><Textarea rows={3} value={values.notes} onChange={(event) => onUpdate('notes', event.target.value)} placeholder="Usual portion, home version, restaurant version…" /></RecipeField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}><X /> Clear</Button>
        <Button type="submit" loading={saving}><Save /> {editing ? 'Save' : 'Add'}</Button>
      </div>
    </Form>
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
    ingredients: recipe.ingredients || '',
    notes: recipe.notes || '',
  }
}
