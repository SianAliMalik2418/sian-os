import { describe, expect, it } from 'vitest'
import { nutritionEntryFromRecipe } from './nutrition-entries'
import type { Recipe } from './types'

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
  it('builds a daily nutrition row from one saved recipe serving', () => {
    expect(nutritionEntryFromRecipe(recipe, '2026-08-17')).toEqual({
      date: '2026-08-17',
      item_name: 'Egg',
      calories: 100,
      protein_grams: 6,
      fat_grams: 5,
      carb_grams: 1,
    })
  })
})
