import { describe, expect, it } from 'vitest'
import { groupedNutritionEntries, nutritionEntriesFromRecipes, nutritionEntryFromRecipe } from './nutrition-entries'
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

  it('keeps decimal saved recipe servings in the logged row', () => {
    expect(nutritionEntryFromRecipe(recipe, '2026-08-17', 1.5)).toEqual({
      date: '2026-08-17',
      item_name: 'Egg x1.5',
      calories: 150,
      protein_grams: 9,
      fat_grams: 7.5,
      carb_grams: 1.5,
    })
  })

  it('does not round decimal macro totals from fractional servings', () => {
    expect(nutritionEntryFromRecipe({ ...recipe, calories: 1, protein_grams: 1, fat_grams: 1, carb_grams: 1 }, '2026-08-17', 1.5)).toEqual({
      date: '2026-08-17',
      item_name: 'Egg x1.5',
      calories: 1.5,
      protein_grams: 1.5,
      fat_grams: 1.5,
      carb_grams: 1.5,
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

  it('builds rows for selected recipes with their quantities', () => {
    const aloo = {
      ...recipe,
      id: 13,
      name: 'Aloo Bhuji',
      calories: 500,
      protein_grams: 10,
      fat_grams: 20,
      carb_grams: 72,
    }

    expect(nutritionEntriesFromRecipes([recipe, aloo], '2026-08-17', new Set([12, 13]), { 12: 2, 13: 1 })).toEqual([
      {
        date: '2026-08-17',
        item_name: 'Egg x2',
        calories: 200,
        protein_grams: 12,
        fat_grams: 10,
        carb_grams: 2,
      },
      {
        date: '2026-08-17',
        item_name: 'Aloo Bhuji',
        calories: 500,
        protein_grams: 10,
        fat_grams: 20,
        carb_grams: 72,
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
