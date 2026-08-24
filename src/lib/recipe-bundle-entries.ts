import { nutritionEntryFromRecipe } from './nutrition-entries'
import type { NutritionEntryInput } from './schemas'
import type { RecipeBundle } from './types'

export function nutritionEntriesFromRecipeBundle(bundle: RecipeBundle, date: string, quantities: Record<number, number>): NutritionEntryInput[] {
  return bundle.recipes.map((recipe) => nutritionEntryFromRecipe(recipe, date, quantities[recipe.id] ?? recipe.default_quantity))
}
