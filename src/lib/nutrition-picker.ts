export type NutritionEntryMode = 'manual' | 'recipes'

export function shouldLoadRecipesForNutritionPicker({
  compact,
  addOpen,
  mode,
  recipesLoaded,
  recipesLoading,
}: {
  compact: boolean
  addOpen: boolean
  mode: NutritionEntryMode
  recipesLoaded: boolean
  recipesLoading: boolean
}) {
  if (recipesLoaded || recipesLoading) return false
  if (compact) return mode === 'recipes'
  return addOpen && mode === 'recipes'
}
