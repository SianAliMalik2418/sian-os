export const minServingQuantity = 0.25
export const maxServingQuantity = 20

export function clampServingQuantity(quantity: number) {
  return Math.max(minServingQuantity, Math.min(maxServingQuantity, quantity))
}

export function servingQuantityFromInput(value: string) {
  if (value.trim() === '') return undefined
  const quantity = Number(value)
  if (!Number.isFinite(quantity)) return undefined
  if (quantity < minServingQuantity || quantity > maxServingQuantity) return undefined
  return quantity
}
