import { describe, expect, it } from 'vitest'
import { shouldLoadBundlesForNutritionPicker, shouldLoadRecipesForNutritionPicker } from './nutrition-picker'

describe('nutrition picker helpers', () => {
  it('loads recipes when the compact picker is on the recipes tab', () => {
    expect(shouldLoadRecipesForNutritionPicker({
      compact: true,
      addOpen: false,
      mode: 'recipes',
      recipesLoaded: false,
      recipesLoading: false,
    })).toBe(true)
  })

  it('does not load recipes while the compact picker is on manual entry', () => {
    expect(shouldLoadRecipesForNutritionPicker({
      compact: true,
      addOpen: false,
      mode: 'manual',
      recipesLoaded: false,
      recipesLoading: false,
    })).toBe(false)
  })

  it('loads recipes when the full add-food dialog is on the recipes tab', () => {
    expect(shouldLoadRecipesForNutritionPicker({
      compact: false,
      addOpen: true,
      mode: 'recipes',
      recipesLoaded: false,
      recipesLoading: false,
    })).toBe(true)
  })

  it('does not load recipes while the full add-food dialog is on manual entry', () => {
    expect(shouldLoadRecipesForNutritionPicker({
      compact: false,
      addOpen: true,
      mode: 'manual',
      recipesLoaded: false,
      recipesLoading: false,
    })).toBe(false)
  })

  it('loads bundles when the picker is on the bundles tab', () => {
    expect(shouldLoadBundlesForNutritionPicker({
      compact: false,
      addOpen: true,
      mode: 'bundles',
      bundlesLoaded: false,
      bundlesLoading: false,
    })).toBe(true)
  })
})
