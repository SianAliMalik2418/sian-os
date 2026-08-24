import { nutritionEntryFromRecipe } from './nutrition-entries'
import type { NutritionEntryInput } from './schemas'
import type { Recipe, RecipeBundle } from './types'

export function nutritionEntriesFromRecipeBundle(bundle: RecipeBundle, date: string, quantities: Record<number, number>): NutritionEntryInput[] {
  return bundle.recipes.map((recipe) => nutritionEntryFromRecipe(recipe, date, quantities[recipe.id] ?? recipe.default_quantity))
}

export function recipePickerStateFromBundle(currentRecipes: Recipe[], bundle: RecipeBundle, recipesLoaded: boolean) {
  const byId = new Map(currentRecipes.map((recipe) => [recipe.id, recipe]))
  for (const recipe of bundle.recipes) byId.set(recipe.id, recipe)

  return {
    recipes: [...byId.values()].sort((a, b) => a.name.localeCompare(b.name)),
    recipesLoaded,
    selectedRecipeIds: new Set(bundle.recipes.map((recipe) => recipe.id)),
    recipeQuantities: Object.fromEntries(bundle.recipes.map((recipe) => [recipe.id, recipe.default_quantity])),
  }
}
