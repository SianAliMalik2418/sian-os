import { describe, expect, it } from 'vitest'
import { groupedNutritionEntries, nutritionEntryFromRecipe } from './nutrition-entries'
import type { NutritionEntry, Recipe } from './types'

const recipe: Recipe = {
  id: 12,
  name: 'Egg',
  aliases: 'anda',
  category: 'protein',
  serving_description: '1 egg',
  calories: 100,
  protein_grams: 6,
  fat_grams: 5,
  carb_grams: 1,
  ingredients: 'Egg',
  notes: null,
  photo_r2_key: null,
  photo_content_type: null,
  created_at: '2026-08-17 08:00:00',
  updated_at: '2026-08-17 08:00:00',
}

describe('nutrition entry helpers', () => {
  it('builds a daily nutrition row from saved recipe servings', () => {
    expect(nutritionEntryFromRecipe(recipe, '2026-08-17', 3)).toEqual({
      date: '2026-08-17',
      item_name: 'Egg x3',
      calories: 300,
      protein_grams: 18,
      fat_grams: 15,
      carb_grams: 3,
    })
  })

  it('groups repeated item rows by name and per-serving macros', () => {
    const entries: NutritionEntry[] = [
      entry({ id: 1, item_name: 'Bread', calories: 100, protein_grams: 4, fat_grams: 1, carb_grams: 20 }),
      entry({ id: 2, item_name: 'bread ', calories: 100, protein_grams: 4, fat_grams: 1, carb_grams: 20 }),
      entry({ id: 3, item_name: 'Egg', calories: 80, protein_grams: 6, fat_grams: 5, carb_grams: 1 }),
    ]

    expect(groupedNutritionEntries(entries)).toEqual([
      {
        ids: [1, 2],
        item_name: 'Bread',
        quantity: 2,
        calories: 200,
        protein_grams: 8,
        fat_grams: 2,
        carb_grams: 40,
      },
      {
        ids: [3],
        item_name: 'Egg',
        quantity: 1,
        calories: 80,
        protein_grams: 6,
        fat_grams: 5,
        carb_grams: 1,
      },
    ])
  })
})

function entry(values: Pick<NutritionEntry, 'id' | 'item_name' | 'calories' | 'protein_grams' | 'fat_grams' | 'carb_grams'>): NutritionEntry {
  return {
    date: '2026-08-17',
    created_at: '2026-08-17 08:00:00',
    updated_at: '2026-08-17 08:00:00',
    ...values,
  }
}
