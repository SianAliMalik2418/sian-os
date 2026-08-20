import { z } from 'zod'

const date = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, 'Use a real calendar date')
const optionalText = z.string().trim().max(2000).optional()
export const dateSchema = date

export const checkinSchema = z.object({
  date,
  weight_kg: z.number().positive().max(500).optional(),
  waist_inches: z.number().positive().max(200).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  water_liters: z.number().min(0).max(30).optional(),
  protein_grams: z.number().min(0).max(2000).optional(),
  fat_grams: z.number().min(0).max(2000).optional(),
  carb_grams: z.number().min(0).max(2000).optional(),
  calories: z.number().min(0).max(20000).optional(),
  nutrition_notes: optionalText,
  workout_text: optionalText,
  notes: optionalText,
}).strict()

export const profileSchema = z.object({
  height_cm: z.number().positive().max(300).optional(),
  weight_kg: z.number().positive().max(500).optional(),
  age: z.number().int().min(1).max(130).optional(),
  goals: optionalText,
  experience_level: z.string().trim().max(100).optional(),
  training_style: z.string().trim().max(500).optional(),
  gym_schedule: z.string().trim().max(500).optional(),
  equipment: optionalText,
  injuries: optionalText,
  long_term_vision: optionalText,
  calorie_goal: z.number().int().min(0).max(20000).optional(),
  protein_goal: z.number().int().min(0).max(2000).optional(),
})

export const nutritionEntrySchema = z.object({
  date,
  item_name: z.string().trim().min(1).max(200),
  calories: z.number().min(0).max(20000),
  protein_grams: z.number().min(0).max(2000).optional(),
  fat_grams: z.number().min(0).max(2000).optional(),
  carb_grams: z.number().min(0).max(2000).optional(),
}).strict()

export const recipeSchema = z.object({
  name: z.string().trim().min(1).max(500),
  aliases: z.string().trim().max(500).optional(),
  category: z.string().trim().max(500).optional(),
  serving_description: z.string().trim().max(500).optional(),
  calories: z.number().int().min(0).max(20000),
  protein_grams: z.number().int().min(0).max(2000),
  fat_grams: z.number().int().min(0).max(2000).optional(),
  carb_grams: z.number().int().min(0).max(2000).optional(),
  ingredients: optionalText,
  notes: optionalText,
}).strict()

export type CheckinInput = z.infer<typeof checkinSchema>
export type NutritionEntryInput = z.infer<typeof nutritionEntrySchema>
export type RecipeInput = z.infer<typeof recipeSchema>
