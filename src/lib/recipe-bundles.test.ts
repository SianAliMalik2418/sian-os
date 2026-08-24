import { describe, expect, it } from 'vitest'
import { nutritionEntriesFromRecipeBundle } from './recipe-bundle-entries'
import type { RecipeBundle } from './types'

const breakfast: RecipeBundle = {
  id: 1,
  name: 'Breakfast',
  notes: 'Usual breakfast',
  recipes: [
    recipeItem({ id: 10, name: 'Shake', default_quantity: 1, calories: 450, protein_grams: 35, fat_grams: 12, carb_grams: 45 }),
    recipeItem({ id: 11, name: 'Shami', default_quantity: 1, calories: 180, protein_grams: 14, fat_grams: 10, carb_grams: 8 }),
  ],
  created_at: '2026-08-24 08:00:00',
  updated_at: '2026-08-24 08:00:00',
}

describe('recipe bundle helpers', () => {
  it('builds daily nutrition rows from a saved bundle', () => {
    expect(nutritionEntriesFromRecipeBundle(breakfast, '2026-08-24', {})).toEqual([
      {
        date: '2026-08-24',
        item_name: 'Shake',
        calories: 450,
        protein_grams: 35,
        fat_grams: 12,
        carb_grams: 45,
      },
      {
        date: '2026-08-24',
        item_name: 'Shami',
        calories: 180,
        protein_grams: 14,
        fat_grams: 10,
        carb_grams: 8,
      },
    ])
  })

  it('uses one-day recipe quantity overrides without changing bundle defaults', () => {
    expect(nutritionEntriesFromRecipeBundle(breakfast, '2026-08-24', { 11: 2 })).toContainEqual({
      date: '2026-08-24',
      item_name: 'Shami x2',
      calories: 360,
      protein_grams: 28,
      fat_grams: 20,
      carb_grams: 16,
    })
    expect(breakfast.recipes.find((recipe) => recipe.id === 11)?.default_quantity).toBe(1)
  })
})

function recipeItem(values: {
  id: number
  name: string
  default_quantity: number
  calories: number
  protein_grams: number
  fat_grams: number
  carb_grams: number
}) {
  return {
    bundle_item_id: values.id + 100,
    bundle_id: 1,
    recipe_id: values.id,
    position: values.id,
    default_quantity: values.default_quantity,
    id: values.id,
    name: values.name,
    aliases: null,
    category: null,
    serving_description: null,
    calories: values.calories,
    protein_grams: values.protein_grams,
    fat_grams: values.fat_grams,
    carb_grams: values.carb_grams,
    ingredients: null,
    notes: null,
    photo_r2_key: null,
    photo_content_type: null,
    created_at: '2026-08-24 08:00:00',
    updated_at: '2026-08-24 08:00:00',
  }
}
