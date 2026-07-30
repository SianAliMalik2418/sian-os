export interface DailyCheckin {
  id: number
  date: string
  weight_kg: number | null
  sleep_time: string | null
  wake_time: string | null
  sleep_hours: number | null
  water_liters: number | null
  protein_grams: number | null
  nutrition_notes: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: number
  height_cm: number | null
  weight_kg: number | null
  age: number | null
  goals: string | null
  experience_level: string | null
  training_style: string | null
  gym_schedule: string | null
  equipment: string | null
  injuries: string | null
  long_term_vision: string | null
  updated_at: string
}

export interface ProgressPhoto {
  id: number
  date: string
  label: string | null
  notes: string | null
  created_at: string
}

export interface DashboardSummary {
  checkin: DailyCheckin | null
  weightTrend: Array<{ date: string; weight_kg: number }>
  streak: number
  weeklyCheckins: Array<{ date: string }>
}
