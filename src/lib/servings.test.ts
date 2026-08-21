import { describe, expect, it } from 'vitest'
import { clampServingQuantity, servingQuantityFromInput } from './servings'

describe('serving quantity input', () => {
  it('allows blank text while the user is editing', () => {
    expect(servingQuantityFromInput('')).toBeUndefined()
  })

  it('parses a replacement value instead of restoring the previous quantity', () => {
    expect(servingQuantityFromInput('5')).toBe(5)
  })

  it('does not clamp an unfinished decimal while the user is typing', () => {
    expect(servingQuantityFromInput('0')).toBeUndefined()
    expect(servingQuantityFromInput('0.5')).toBe(0.5)
  })

  it('clamps button changes to the serving range', () => {
    expect(clampServingQuantity(0)).toBe(0.25)
    expect(clampServingQuantity(21)).toBe(20)
  })
})
