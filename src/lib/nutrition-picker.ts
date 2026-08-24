export type NutritionEntryMode = 'manual' | 'recipes' | 'bundles'

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

export function shouldLoadBundlesForNutritionPicker({
  compact,
  addOpen,
  mode,
  bundlesLoaded,
  bundlesLoading,
}: {
  compact: boolean
  addOpen: boolean
  mode: NutritionEntryMode
  bundlesLoaded: boolean
  bundlesLoading: boolean
}) {
  if (bundlesLoaded || bundlesLoading) return false
  if (compact) return mode === 'bundles'
  return addOpen && mode === 'bundles'
}
