import { Boxes, Minus, Plus, Save, Search, Trash2, Utensils } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { groupedNutritionEntries, nutritionEntriesFromRecipes } from '@/lib/nutrition-entries'
import { recipePickerStateFromBundle } from '@/lib/recipe-bundle-entries'
import { shouldLoadBundlesForNutritionPicker, shouldLoadRecipesForNutritionPicker, type NutritionEntryMode } from '@/lib/nutrition-picker'
import { clampServingQuantity, servingQuantityFromInput } from '@/lib/servings'
import type { DailyCheckin, NutritionEntry, Recipe, RecipeBundle } from '@/lib/types'

const emptyRecipeValues = {
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
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [recipesLoaded, setRecipesLoaded] = useState(false)
  const [bundles, setBundles] = useState<RecipeBundle[]>([])
  const [bundlesLoading, setBundlesLoading] = useState(false)
  const [bundlesLoaded, setBundlesLoaded] = useState(false)
  const [recipeQuery, setRecipeQuery] = useState('')
  const [bundleQuery, setBundleQuery] = useState('')
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<number>>(new Set())
  const [recipeQuantities, setRecipeQuantities] = useState<Record<number, number>>({})
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false)
  const [recipeValues, setRecipeValues] = useState<Record<string, string>>(emptyRecipeValues)
  const [recipeSaving, setRecipeSaving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [addOpen, setAddOpen] = useState(false)
  const [entryMode, setEntryMode] = useState<NutritionEntryMode>('manual')

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

  useEffect(() => {
    if (!shouldLoadRecipesForNutritionPicker({ compact, addOpen, mode: entryMode, recipesLoaded, recipesLoading })) return
    void loadRecipes()
  }, [addOpen, compact, entryMode, recipesLoaded, recipesLoading])

  useEffect(() => {
    if (!shouldLoadBundlesForNutritionPicker({ compact, addOpen, mode: entryMode, bundlesLoaded, bundlesLoading })) return
    void loadBundles()
  }, [addOpen, compact, entryMode, bundlesLoaded, bundlesLoading])

  const groupedEntries = groupedNutritionEntries(entries)
  const filteredRecipes = useMemo(() => {
    const needle = recipeQuery.trim().toLowerCase()
    if (!needle) return recipes
    return recipes.filter((recipe) => [recipe.name, recipe.aliases, recipe.category, recipe.ingredients].some((value) => value?.toLowerCase().includes(needle)))
  }, [recipeQuery, recipes])
  const filteredBundles = useMemo(() => {
    const needle = bundleQuery.trim().toLowerCase()
    if (!needle) return bundles
    return bundles.filter((bundle) => [bundle.name, bundle.notes, ...bundle.recipes.flatMap((recipe) => [recipe.name, recipe.aliases])].some((value) => value?.toLowerCase().includes(needle)))
  }, [bundleQuery, bundles])
  const selectedRecipes = useMemo(() => recipes.filter((recipe) => selectedRecipeIds.has(recipe.id)), [recipes, selectedRecipeIds])
  const selectedTotals = selectedRecipes.reduce((totals, recipe) => {
    const quantity = recipeQuantities[recipe.id] || 1
    totals.calories += recipe.calories * quantity
    totals.protein += recipe.protein_grams * quantity
    totals.fats += recipe.fat_grams * quantity
    totals.carbs += recipe.carb_grams * quantity
    return totals
  }, { calories: 0, protein: 0, fats: 0, carbs: 0 })

  async function loadRecipes() {
    setRecipesLoading(true)
    setError(undefined)
    try {
      const response = await fetch('/api/recipes')
      const result = await response.json() as { data?: Recipe[]; error?: { message?: string } }
      if (!response.ok || !result.data) throw new Error(result.error?.message || 'Could not load recipes')
      setRecipes(result.data)
      setRecipesLoaded(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load recipes')
    } finally {
      setRecipesLoading(false)
    }
  }

  async function loadBundles() {
    setBundlesLoading(true)
    setError(undefined)
    try {
      const response = await fetch('/api/recipe-bundles')
      const result = await response.json() as { data?: RecipeBundle[]; error?: { message?: string } }
      if (!response.ok || !result.data) throw new Error(result.error?.message || 'Could not load bundles')
      setBundles(result.data)
      setBundlesLoaded(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load bundles')
    } finally {
      setBundlesLoading(false)
    }
  }

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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save food item')
    } finally {
      setSaving(false)
    }
  }

  async function saveSelectedRecipes() {
    if (!selectedRecipeIds.size) {
      setError('Select at least one recipe')
      return
    }

    setSaving(true)
    setError(undefined)
    try {
      const payloads = nutritionEntriesFromRecipes(recipes, date, selectedRecipeIds, recipeQuantities)
      const savedEntries: NutritionEntry[] = []
      let latestCheckin: DailyCheckin | undefined

      for (const payload of payloads) {
        const response = await fetch('/api/nutrition-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const result = await response.json() as { data?: { entry?: NutritionEntry; checkin?: DailyCheckin }; error?: { message?: string } }
        if (!response.ok || !result.data?.entry || !result.data.checkin) throw new Error(result.error?.message || `Could not log ${payload.item_name}`)
        savedEntries.push(result.data.entry)
        latestCheckin = result.data.checkin
      }

      setEntries((current) => [...current, ...savedEntries])
      if (latestCheckin) onCheckinChange?.(latestCheckin)
      setSelectedRecipeIds(new Set())
      setRecipeQuantities({})
      setAddOpen(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save selected recipes')
    } finally {
      setSaving(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await addEntry()
  }

  async function submitRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRecipeSaving(true)
    setError(undefined)
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipeValues.name,
          aliases: recipeValues.aliases || undefined,
          category: recipeValues.category || undefined,
          serving_description: recipeValues.serving_description || undefined,
          calories: Number(recipeValues.calories),
          protein_grams: Number(recipeValues.protein_grams),
          fat_grams: recipeValues.fat_grams === '' ? undefined : Number(recipeValues.fat_grams),
          carb_grams: recipeValues.carb_grams === '' ? undefined : Number(recipeValues.carb_grams),
          ingredients: recipeValues.ingredients || undefined,
          notes: recipeValues.notes || undefined,
        }),
      })
      const result = await response.json() as { data?: Recipe; error?: { message?: string } }
      if (!response.ok || !result.data) throw new Error(result.error?.message || 'Could not save recipe')
      const saved = result.data
      setRecipes((current) => [...current, saved].sort((a, b) => a.name.localeCompare(b.name)))
      setRecipesLoaded(true)
      setSelectedRecipeIds((current) => new Set(current).add(saved.id))
      setRecipeQuantities((current) => ({ ...current, [saved.id]: 1 }))
      setRecipeValues(emptyRecipeValues)
      setRecipeDialogOpen(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save recipe')
    } finally {
      setRecipeSaving(false)
    }
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
    setEntryMode('manual')
    setAddOpen(true)
  }

  function setRecipeSelected(recipeId: number, selected: boolean) {
    setSelectedRecipeIds((current) => {
      const next = new Set(current)
      if (selected) next.add(recipeId)
      else next.delete(recipeId)
      return next
    })
    if (selected) setRecipeQuantities((current) => ({ ...current, [recipeId]: current[recipeId] || 1 }))
  }

  function setRecipeQuantity(recipeId: number, quantity: number) {
    setRecipeQuantities((current) => ({ ...current, [recipeId]: clampServingQuantity(quantity) }))
  }

  function useBundle(bundle: RecipeBundle) {
    const next = recipePickerStateFromBundle(recipes, bundle, recipesLoaded)
    setRecipes(next.recipes)
    setRecipesLoaded(next.recipesLoaded)
    setSelectedRecipeIds(next.selectedRecipeIds)
    setRecipeQuantities(next.recipeQuantities)
    setRecipeQuery('')
    setEntryMode('recipes')
  }

  function updateRecipeValue(name: string, value: string) {
    setRecipeValues((current) => ({ ...current, [name]: value }))
  }

  const entryFields = <NutritionEntryFields itemName={itemName} calories={calories} protein={protein} fats={fats} carbs={carbs} onItemNameChange={setItemName} onCaloriesChange={setCalories} onProteinChange={setProtein} onFatsChange={setFats} onCarbsChange={setCarbs} />

  const manualEntryFields = (
    <div className="grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_7rem_7rem_7rem_7rem]">
      {entryFields}
    </div>
  )

  const manualEntryForm = (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
      {manualEntryFields}
      <Button type="button" loading={saving} className="self-end" onClick={addEntry}>Add</Button>
    </div>
  )

  const recipePicker = (
    <>
      <div className="flex flex-col gap-2 rounded-xl border bg-secondary/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Selected: {selectedRecipeIds.size}</p>
          <p className="text-xs text-muted-foreground">{selectedTotals.calories} kcal · {selectedTotals.protein} g protein · {selectedTotals.fats} g fat · {selectedTotals.carbs} g carbs</p>
          <p className="mt-1 text-xs text-muted-foreground">Change quantities, uncheck foods, or add more recipes before logging.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setRecipeDialogOpen(true)}><Plus /> New recipe</Button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <Input nativeInput value={recipeQuery} onChange={(event) => setRecipeQuery(event.target.value)} placeholder="Search recipes, aliases, ingredients..." className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
      </div>

      {recipesLoading ? <p className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">Loading recipes...</p> : null}

      {!recipesLoading && filteredRecipes.length ? (
        <div className="grid max-h-[52vh] gap-3 overflow-y-auto pr-1">
          {filteredRecipes.map((recipe) => {
            const selected = selectedRecipeIds.has(recipe.id)
            const quantity = recipeQuantities[recipe.id] || 1
            return (
              <div key={recipe.id} className="grid gap-3 rounded-xl border bg-background p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <Checkbox checked={selected} onCheckedChange={(checked) => setRecipeSelected(recipe.id, checked === true)} aria-label={`Select ${recipe.name}`} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{recipe.name}</p>
                    {recipe.category && <Badge variant="secondary">{recipe.category}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{recipe.serving_description || '1 serving'} · {recipe.calories * quantity} kcal · {recipe.protein_grams * quantity} g protein · {recipe.fat_grams * quantity} g fat · {recipe.carb_grams * quantity} g carbs</p>
                </div>
                <QuantityControl
                  label={`${recipe.name} quantity`}
                  value={quantity}
                  disabled={!selected}
                  onChange={(next) => {
                    setRecipeSelected(recipe.id, true)
                    setRecipeQuantity(recipe.id, next)
                  }}
                />
              </div>
            )
          })}
        </div>
      ) : null}

      {!recipesLoading && !recipes.length ? <p className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">No saved recipes yet. Create one here, then log it today.</p> : null}
      {!recipesLoading && recipes.length > 0 && !filteredRecipes.length ? <p className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">No recipes match that search.</p> : null}
    </>
  )

  const bundlePicker = (
    <>
      <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <Input nativeInput value={bundleQuery} onChange={(event) => setBundleQuery(event.target.value)} placeholder="Search bundles, recipes..." className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
      </div>

      {bundlesLoading ? <p className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">Loading bundles...</p> : null}

      {!bundlesLoading && filteredBundles.length ? (
        <div className="grid max-h-[52vh] gap-3 overflow-y-auto pr-1">
          {filteredBundles.map((bundle) => {
            const totals = bundle.recipes.reduce((sum, recipe) => {
              sum.calories += recipe.calories * recipe.default_quantity
              sum.protein += recipe.protein_grams * recipe.default_quantity
              sum.fats += recipe.fat_grams * recipe.default_quantity
              sum.carbs += recipe.carb_grams * recipe.default_quantity
              return sum
            }, { calories: 0, protein: 0, fats: 0, carbs: 0 })
            return (
              <div key={bundle.id} className="grid gap-3 rounded-xl border bg-background p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{bundle.name}</p>
                    <Badge variant="secondary">{bundle.recipes.length} items</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{totals.calories} kcal · {totals.protein} g protein · {totals.fats} g fat · {totals.carbs} g carbs</p>
                  <p className="mt-2 text-xs text-muted-foreground">{bundle.recipes.map((recipe) => `${recipe.name} x${recipe.default_quantity}`).join(' · ')}</p>
                </div>
                <Button type="button" variant="outline" onClick={() => useBundle(bundle)}><Boxes /> Edit items</Button>
              </div>
            )
          })}
        </div>
      ) : null}

      {!bundlesLoading && !bundles.length ? <p className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">No bundles yet. Create one from the Recipes page.</p> : null}
      {!bundlesLoading && bundles.length > 0 && !filteredBundles.length ? <p className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">No bundles match that search.</p> : null}
    </>
  )

  const compactEntryForm = (
    <Tabs value={entryMode} onValueChange={(value) => setEntryMode(value as NutritionEntryMode)} className="rounded-xl border bg-secondary/20 p-3">
      <TabsList className="grid w-full grid-cols-3 sm:w-fit">
        <TabsTab value="manual">Manual</TabsTab>
        <TabsTab value="recipes">Recipes</TabsTab>
        <TabsTab value="bundles">Bundles</TabsTab>
      </TabsList>
      <TabsPanel value="manual" className="pt-2">
        {manualEntryForm}
      </TabsPanel>
      <TabsPanel value="recipes" className="space-y-4 pt-2">
        {recipePicker}
        <div className="flex justify-end">
          <Button type="button" loading={saving} onClick={saveSelectedRecipes}><Utensils /> Log selected</Button>
        </div>
      </TabsPanel>
      <TabsPanel value="bundles" className="space-y-4 pt-2">
        {bundlePicker}
      </TabsPanel>
    </Tabs>
  )

  const addFoodDialogContent = (
    <Tabs value={entryMode} onValueChange={(value) => setEntryMode(value as NutritionEntryMode)} className="gap-4">
      <TabsList className="grid w-full grid-cols-3 sm:w-fit">
        <TabsTab value="manual">Manual</TabsTab>
        <TabsTab value="recipes">Recipes</TabsTab>
        <TabsTab value="bundles">Bundles</TabsTab>
      </TabsList>
      <TabsPanel value="manual" className="pt-1">
        {manualEntryFields}
      </TabsPanel>
      <TabsPanel value="recipes" className="space-y-4 pt-1">
        {recipePicker}
      </TabsPanel>
      <TabsPanel value="bundles" className="space-y-4 pt-1">
        {bundlePicker}
      </TabsPanel>
    </Tabs>
  )

  const body = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NutritionTotal label="Calories" value={calorieTotal} goal={calorieGoal} unit="kcal" />
        <NutritionTotal label="Protein" value={proteinTotal} goal={proteinGoal} unit="g" />
        <NutritionTotal label="Fats" value={fatTotal} unit="g" />
        <NutritionTotal label="Carbs" value={carbTotal} unit="g" />
      </div>

      {compact ? (
        compactEntryForm
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

  const recipeCreateDialog = (
    <RecipeCreateDialog
      open={recipeDialogOpen}
      values={recipeValues}
      saving={recipeSaving}
      onOpenChange={setRecipeDialogOpen}
      onUpdate={updateRecipeValue}
      onSubmit={submitRecipe}
    />
  )

  if (compact) {
    return (
      <>
        {body}
        {recipeCreateDialog}
      </>
    )
  }

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
        <DialogPopup className="max-w-3xl">
          <div className="flex min-h-0 flex-col">
            <DialogHeader>
              <DialogTitle>Add food</DialogTitle>
              <DialogDescription>Add a manual food row or choose saved recipes for today.</DialogDescription>
            </DialogHeader>
            <DialogPanel className="space-y-4">
              {addFoodDialogContent}
              {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>}
            </DialogPanel>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              {entryMode === 'manual'
                ? <Button type="button" loading={saving} onClick={addEntry}>Add food</Button>
                : entryMode === 'recipes'
                  ? <Button type="button" loading={saving} onClick={saveSelectedRecipes}><Utensils /> Log selected</Button>
                  : null}
            </DialogFooter>
          </div>
        </DialogPopup>
      </Dialog>

      {recipeCreateDialog}
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

function QuantityControl({ label, value, disabled, onChange }: {
  label: string
  value: number
  disabled?: boolean
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  function updateDraft(nextDraft: string) {
    setDraft(nextDraft)
    const quantity = servingQuantityFromInput(nextDraft)
    if (quantity !== undefined) onChange(quantity)
  }

  function resetBlankDraft() {
    if (draft.trim() === '') setDraft(String(value))
  }

  return (
    <div className="grid w-full grid-cols-[2.5rem_minmax(4.5rem,1fr)_2.5rem] items-center rounded-lg border bg-background p-1 sm:w-40" aria-label={label}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Decrease ${label}`} onClick={() => onChange(value - 0.25)} disabled={disabled || value <= 0.25}><Minus /></Button>
      <Input nativeInput type="number" min="0.25" max="20" step="0.25" inputMode="decimal" aria-label={`${label} value`} value={draft} disabled={disabled} onBlur={resetBlankDraft} onChange={(event) => updateDraft(event.target.value)} className="h-9 min-w-0 px-2 text-center text-sm tabular-nums" />
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Increase ${label}`} onClick={() => onChange(value + 0.25)} disabled={disabled}><Plus /></Button>
    </div>
  )
}

function RecipeCreateDialog({ open, values, saving, onOpenChange, onUpdate, onSubmit }: {
  open: boolean
  values: Record<string, string>
  saving: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (name: string, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <Form onSubmit={onSubmit} className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>New recipe</DialogTitle>
            <DialogDescription>Save macros for one normal serving, then log it from the selected list.</DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-4">
            <RecipeField label="Name"><Input nativeInput required value={values.name} onChange={(event) => onUpdate('name', event.target.value)} placeholder="Egg" /></RecipeField>
            <RecipeField label="Aliases" description="Comma-separated names the agent may see">
              <Input nativeInput value={values.aliases} onChange={(event) => onUpdate('aliases', event.target.value)} placeholder="anda, boiled egg" />
            </RecipeField>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <RecipeField label="Calories"><Input nativeInput required type="number" min="0" max="20000" step="1" inputMode="numeric" value={values.calories} onChange={(event) => onUpdate('calories', event.target.value)} /></RecipeField>
              <RecipeField label="Protein"><Input nativeInput required type="number" min="0" max="2000" step="1" inputMode="numeric" value={values.protein_grams} onChange={(event) => onUpdate('protein_grams', event.target.value)} /></RecipeField>
              <RecipeField label="Fats"><Input nativeInput type="number" min="0" max="2000" step="1" inputMode="numeric" value={values.fat_grams} onChange={(event) => onUpdate('fat_grams', event.target.value)} /></RecipeField>
              <RecipeField label="Carbs"><Input nativeInput type="number" min="0" max="2000" step="1" inputMode="numeric" value={values.carb_grams} onChange={(event) => onUpdate('carb_grams', event.target.value)} /></RecipeField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <RecipeField label="Serving"><Input nativeInput value={values.serving_description} onChange={(event) => onUpdate('serving_description', event.target.value)} placeholder="1 egg, 1 plate, 1 bowl" /></RecipeField>
              <RecipeField label="Category"><Input nativeInput value={values.category} onChange={(event) => onUpdate('category', event.target.value)} placeholder="Snack, dish, drink" /></RecipeField>
            </div>
            <RecipeField label="Ingredients"><Textarea rows={4} value={values.ingredients} onChange={(event) => onUpdate('ingredients', event.target.value)} placeholder="Egg, salt..." /></RecipeField>
            <RecipeField label="Notes"><Textarea rows={3} value={values.notes} onChange={(event) => onUpdate('notes', event.target.value)} placeholder="Usual home portion..." /></RecipeField>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>Cancel</DialogClose>
            <Button type="submit" loading={saving}><Save /> Save recipe</Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  )
}

function RecipeField({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return <Field><FieldLabel>{label}</FieldLabel>{children}{description && <FieldDescription>{description}</FieldDescription>}</Field>
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
