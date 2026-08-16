import { describe, expect, it } from 'vitest'
import { checkinSchema, nutritionEntrySchema, profileSchema } from './schemas'

describe('daily check-in schema', () => {
  it('accepts the streamlined daily fields', () => {
    expect(checkinSchema.parse({
      date: '2026-07-30',
      weight_kg: 80,
      waist_inches: 31.5,
      sleep_hours: 7.5,
      water_liters: 2.5,
      protein_grams: 150,
      fat_grams: 70,
      carb_grams: 300,
      calories: 2400,
      nutrition_notes: 'Breakfast: eggs\nLunch: daal\nDinner: chicken',
      workout_text: 'Lower re-entry session logged in Lyfta',
      notes: 'Good day',
    })).toMatchObject({ date: '2026-07-30', waist_inches: 31.5, sleep_hours: 7.5, fat_grams: 70, carb_grams: 300 })
  })

  it.each(['sleep_time', 'wake_time', 'sleep_quality', 'energy', 'motivation', 'recovery', 'soreness', 'stress', 'mood'])('rejects removed field %s', (field) => {
    expect(() => checkinSchema.parse({ date: '2026-07-30', [field]: 5 })).toThrow()
  })

  it('rejects impossible sleep hours', () => {
    expect(() => checkinSchema.parse({ date: '2026-07-30', sleep_hours: 25 })).toThrow()
  })
})

describe('nutrition entry schema', () => {
  it('accepts one food row', () => {
    expect(nutritionEntrySchema.parse({
      date: '2026-08-16',
      item_name: 'Egg',
      calories: 100,
      protein_grams: 6,
      fat_grams: 5,
      carb_grams: 1,
    })).toMatchObject({ item_name: 'Egg', calories: 100, protein_grams: 6, fat_grams: 5, carb_grams: 1 })
  })
})

describe('profile schema', () => {
  it('accepts editable nutrition goals', () => {
    expect(profileSchema.parse({
      calorie_goal: 2200,
      protein_goal: 100,
    })).toMatchObject({ calorie_goal: 2200, protein_goal: 100 })
  })
})
