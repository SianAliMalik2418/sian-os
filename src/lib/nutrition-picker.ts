export type CompactNutritionMode = 'manual' | 'recipes'

export function shouldLoadRecipesForNutritionPicker({
  compact,
  addOpen,
  compactMode,
  recipesLoaded,
  recipesLoading,
}: {
  compact: boolean
  addOpen: boolean
  compactMode: CompactNutritionMode
  recipesLoaded: boolean
  recipesLoading: boolean
}) {
  if (recipesLoaded || recipesLoading) return false
  return compact ? compactMode === 'recipes' : addOpen
}
