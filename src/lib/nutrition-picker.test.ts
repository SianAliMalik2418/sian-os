import { describe, expect, it } from 'vitest'
import { shouldLoadRecipesForNutritionPicker } from './nutrition-picker'

describe('nutrition picker helpers', () => {
  it('loads recipes when the compact picker is on the recipes tab', () => {
    expect(shouldLoadRecipesForNutritionPicker({
      compact: true,
      addOpen: false,
      compactMode: 'recipes',
      recipesLoaded: false,
      recipesLoading: false,
    })).toBe(true)
  })

  it('does not load recipes while the compact picker is on manual entry', () => {
    expect(shouldLoadRecipesForNutritionPicker({
      compact: true,
      addOpen: false,
      compactMode: 'manual',
      recipesLoaded: false,
      recipesLoading: false,
    })).toBe(false)
  })

  it('loads recipes for the full add-food dialog', () => {
    expect(shouldLoadRecipesForNutritionPicker({
      compact: false,
      addOpen: true,
      compactMode: 'manual',
      recipesLoaded: false,
      recipesLoading: false,
    })).toBe(true)
  })
})
