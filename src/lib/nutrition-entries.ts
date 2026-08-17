import type { NutritionEntryInput } from './schemas'
import type { Recipe } from './types'

export function nutritionEntryFromRecipe(recipe: Recipe, date: string): NutritionEntryInput {
  return {
    date,
    item_name: recipe.name,
    calories: recipe.calories,
    protein_grams: recipe.protein_grams,
    fat_grams: recipe.fat_grams,
    carb_grams: recipe.carb_grams,
  }
}
