export interface DailyCheckin {
  id: number
  date: string
  weight_kg: number | null
  sleep_time: string | null
  wake_time: string | null
  sleep_hours: number | null
  water_liters: number | null
  protein_grams: number | null
  notes: string | null
  created_at: string
  updated_at: string
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
  body_weight_change: number | null
  nutrition_consistency: number | null
  water_consistency: number | null
  wins: string | null
  lessons: string | null
  focus_next_week: string | null
  created_at: string
}

export interface DashboardSummary {
  checkin: DailyCheckin | null
  weightTrend: Array<{ date: string; weight_kg: number }>
  streak: number
  weeklyCheckins: Array<{ date: string }>
}
