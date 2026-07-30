import { z } from 'zod'

const date = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, 'Use a real calendar date')
const optionalText = z.string().trim().max(2000).optional()
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm')
const rating = z.number().int().min(1).max(10).optional()

export const checkinSchema = z.object({
  date,
  weight_kg: z.number().positive().max(500).optional(),
  sleep_time: time.optional(),
  wake_time: time.optional(),
  water_liters: z.number().min(0).max(30).optional(),
  protein_grams: z.number().int().min(0).max(2000).optional(),
  notes: optionalText,
}).strict().superRefine((input, context) => {
  if (Boolean(input.sleep_time) !== Boolean(input.wake_time)) {
    context.addIssue({ code: 'custom', message: 'Sleep and wake time must be provided together', path: [input.sleep_time ? 'wake_time' : 'sleep_time'] })
  }
})

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
})

export const bodyMeasurementSchema = z.object({
  date,
  weight_kg: z.number().positive().max(500).optional(),
  chest_cm: z.number().positive().max(500).optional(),
  waist_cm: z.number().positive().max(500).optional(),
  hips_cm: z.number().positive().max(500).optional(),
  arm_cm: z.number().positive().max(500).optional(),
  thigh_cm: z.number().positive().max(500).optional(),
  notes: optionalText,
})

export const nutritionSchema = z.object({
  date,
  meal: z.string().trim().max(500).optional(),
  protein_grams: z.number().int().min(0).max(2000).optional(),
  water_liters: z.number().min(0).max(30).optional(),
  supplements: z.string().trim().max(1000).optional(),
  consistency: rating,
  notes: optionalText,
})

export const weeklyReviewSchema = z.object({
  week_start: date,
  wins: optionalText,
  lessons: optionalText,
  focus_next_week: optionalText,
}).strict()

export type CheckinInput = z.infer<typeof checkinSchema>
