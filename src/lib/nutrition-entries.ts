import type { NutritionEntryInput } from './schemas'
import type { NutritionEntry, Recipe } from './types'

export interface GroupedNutritionEntry {
  ids: number[]
  item_name: string
  quantity: number
  calories: number
  protein_grams: number
  fat_grams: number
  carb_grams: number
}

export function nutritionEntryFromRecipe(recipe: Recipe, date: string, quantity = 1): NutritionEntryInput {
  const servings = Math.max(1, Math.round(quantity))
  return {
    date,
    item_name: servings > 1 ? `${recipe.name} x${servings}` : recipe.name,
    calories: recipe.calories * servings,
    protein_grams: recipe.protein_grams * servings,
    fat_grams: recipe.fat_grams * servings,
    carb_grams: recipe.carb_grams * servings,
  }
}

export function nutritionEntriesFromRecipes(recipes: Recipe[], date: string, selectedIds: Set<number>, quantities: Record<number, number>): NutritionEntryInput[] {
  return recipes
    .filter((recipe) => selectedIds.has(recipe.id))
    .map((recipe) => nutritionEntryFromRecipe(recipe, date, quantities[recipe.id] || 1))
}

export function groupedNutritionEntries(entries: NutritionEntry[]): GroupedNutritionEntry[] {
  const groups = new Map<string, GroupedNutritionEntry>()

  for (const entry of entries) {
    const key = [
      entry.item_name.trim().toLowerCase(),
      entry.calories,
      entry.protein_grams,
      entry.fat_grams,
      entry.carb_grams,
    ].join('|')
    const current = groups.get(key)

    if (current) {
      current.ids.push(entry.id)
      current.quantity += 1
      current.calories += entry.calories
      current.protein_grams += entry.protein_grams
      current.fat_grams += entry.fat_grams
      current.carb_grams += entry.carb_grams
      continue
    }

    groups.set(key, {
      ids: [entry.id],
      item_name: entry.item_name.trim(),
      quantity: 1,
      calories: entry.calories,
      protein_grams: entry.protein_grams,
      fat_grams: entry.fat_grams,
      carb_grams: entry.carb_grams,
    })
  }

  return [...groups.values()]
}
