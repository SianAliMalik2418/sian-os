export interface DailyCheckin {
  id: number
  date: string
  weight_kg: number | null
  waist_inches: number | null
  sleep_time: string | null
  wake_time: string | null
  sleep_hours: number | null
  water_liters: number | null
  protein_grams: number | null
  fat_grams: number | null
  carb_grams: number | null
  calories: number | null
  nutrition_notes: string | null
  workout_text: string | null
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
  calorie_goal: number | null
  protein_goal: number | null
  updated_at: string
}

export interface ProgressPhoto {
  id: number
  date: string
  label: string | null
  notes: string | null
  created_at: string
}

export interface Recipe {
  id: number
  name: string
  aliases: string | null
  category: string | null
  serving_description: string | null
  calories: number
  protein_grams: number
  ingredients: string | null
  notes: string | null
  photo_r2_key: string | null
  photo_content_type: string | null
  created_at: string
  updated_at: string
}

export interface DashboardSummary {
  checkin: DailyCheckin | null
  profile: Profile | null
  weightTrend: Array<{ date: string; weight_kg: number }>
  streak: number
  weeklyCheckins: Array<{ date: string }>
}
