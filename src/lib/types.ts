export interface DailyCheckin {
  id: number
  date: string
  weight_kg: number | null
  sleep_hours: number | null
  sleep_quality: number | null
  water_liters: number | null
  protein_grams: number | null
  energy: number | null
  motivation: number | null
  recovery: number | null
  mood: string | null
  soreness: number | null
  stress: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Workout {
  id: number
  date: string
  title: string
  program: string | null
  duration_minutes: number | null
  notes: string | null
  created_at: string
}

export interface Exercise {
  id: number
  name: string
  muscle_group: string | null
  equipment: string | null
  notes: string | null
  created_at: string
}

export interface WorkoutSet {
  id: number
  workout_id: number
  exercise_id: number
  exercise_name: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  rir: number | null
  rest_seconds: number | null
  notes: string | null
}

export interface BodyMeasurement {
  id: number
  date: string
  weight_kg: number | null
  chest_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  arm_cm: number | null
  thigh_cm: number | null
  notes: string | null
  created_at: string
}

export interface NutritionLog {
  id: number
  date: string
  meal: string | null
  protein_grams: number | null
  water_liters: number | null
  supplements: string | null
  consistency: number | null
  notes: string | null
  created_at: string
}

export interface ProgressPhoto {
  id: number
  date: string
  label: string | null
  notes: string | null
  created_at: string
}

export interface WeeklyReview {
  id: number
  week_start: string
  workouts_completed: number
  missed_workouts: number
  strength_improvements: string | null
  body_weight_change: number | null
  nutrition_consistency: number | null
  water_consistency: number | null
  recovery_quality: number | null
  best_workout: string | null
  weakest_area: string | null
  wins: string | null
  lessons: string | null
  focus_next_week: string | null
  created_at: string
}

export interface ExerciseHistoryRow {
  workout_id: number
  date: string
  title: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  rir: number | null
  rest_seconds: number | null
  notes: string | null
  estimated_1rm: number | null
}

export interface DashboardSummary {
  checkin: DailyCheckin | null
  workouts: Workout[]
  prs: Array<{ name: string; max_weight: number | null; max_reps: number | null; estimated_1rm: number | null }>
  weightTrend: Array<{ date: string; weight_kg: number }>
  streak: number
  weeklyCheckins: Array<{ date: string }>
  weeklyWorkoutCount: number
}
