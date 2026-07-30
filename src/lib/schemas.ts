import { z } from 'zod'

const date = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, 'Use a real calendar date')
const optionalText = z.string().trim().max(2000).optional()
const rating = z.number().int().min(1).max(10).optional()

export const checkinSchema = z.object({
  date,
  weight_kg: z.number().positive().max(500).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  sleep_quality: rating,
  water_liters: z.number().min(0).max(30).optional(),
  protein_grams: z.number().int().min(0).max(2000).optional(),
  energy: rating,
  motivation: rating,
  recovery: rating,
  mood: z.string().trim().max(80).optional(),
  soreness: rating,
  stress: rating,
  notes: optionalText,
})

export const workoutSetSchema = z.object({
  exercise: z.string().trim().min(1).max(120),
  muscle_group: z.string().trim().max(80).optional(),
  set_number: z.number().int().positive().max(100),
  reps: z.number().int().min(0).max(1000).optional(),
  weight_kg: z.number().min(0).max(2000).optional(),
  rpe: z.number().min(0).max(10).optional(),
  rir: z.number().min(0).max(20).optional(),
  rest_seconds: z.number().int().min(0).max(7200).optional(),
  notes: optionalText,
})

export const workoutSchema = z.object({
  date,
  title: z.string().trim().min(1).max(160),
  program: z.string().trim().max(160).optional(),
  duration_minutes: z.number().int().min(0).max(1440).optional(),
  notes: optionalText,
  sets: z.array(workoutSetSchema).max(200).default([]),
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
  missed_workouts: z.number().int().min(0).max(50).optional(),
  wins: optionalText,
  lessons: optionalText,
  focus_next_week: optionalText,
})

export type CheckinInput = z.infer<typeof checkinSchema>
export type WorkoutInput = z.infer<typeof workoutSchema>
