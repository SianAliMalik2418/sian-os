export interface DailyCheckin {
  id: number
  date: string
  weight_kg: number | null
  waist_inches: number | null
  water_liters: number | null
  steps: number | null
  active_calories: number | null
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

export interface Decision {
  id: number
  date: string
  decision: string
  created_at: string
}

export interface GoalPhase {
  id: number
  phase_type: string
  target_rate_kg_per_week: number | null
  note: string | null
  started_at: string
  ended_at: string | null
  is_active: number
  created_at: string
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
  step_goal: number | null
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
  fat_grams: number
  carb_grams: number
  ingredients: string | null
  notes: string | null
  photo_r2_key: string | null
  photo_content_type: string | null
  created_at: string
  updated_at: string
}

export interface RecipeBundleRecipe extends Recipe {
  bundle_item_id: number
  bundle_id: number
  recipe_id: number
  default_quantity: number
  position: number
}

export interface RecipeBundle {
  id: number
  name: string
  notes: string | null
  recipes: RecipeBundleRecipe[]
  created_at: string
  updated_at: string
}

export interface NutritionEntry {
  id: number
  date: string
  item_name: string
  calories: number
  protein_grams: number
  fat_grams: number
  carb_grams: number
  created_at: string
  updated_at: string
}

export type FinanceBucket = 'family' | 'self' | 'service'

export interface FinanceCategory {
  id: number
  name: string
  bucket: FinanceBucket
  color: string | null
  created_at: string
}

export interface FinanceTransaction {
  id: number
  date: string
  type: 'income' | 'expense'
  amount: number
  category_id: number | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface FinanceDebt {
  id: number
  counterparty: string
  direction: 'owed_by_me' | 'owed_to_me'
  principal: number
  balance: number
  status: 'outstanding' | 'paid'
  due_date: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export type FinanceLevel = 'muslim' | 'mumin' | 'muhsin'

export interface FinanceSettings {
  id: number
  level: FinanceLevel
  muslim_family_pct: number
  muslim_self_pct: number
  muslim_service_pct: number
  mumin_family_pct: number
  mumin_self_pct: number
  mumin_service_pct: number
  muhsin_family_pct: number
  muhsin_self_pct: number
  muhsin_service_pct: number
  emergency_fund_target: number | null
  emergency_fund_balance: number
  updated_at: string
}

export interface FinanceBucketSplit {
  family: number
  self: number
  service: number
}

export interface FinanceSummary {
  from: string
  to: string
  income: number
  expense: number
  net: number
  actual: FinanceBucketSplit
  target: FinanceBucketSplit
  targetPct: FinanceBucketSplit
  owedByMe: number
  owedToMe: number
  settings: FinanceSettings
  trend: Array<{ period: string; income: number; expense: number }>
}

export interface DashboardSummary {
  checkin: DailyCheckin | null
  profile: Profile | null
  nutritionEntries: NutritionEntry[]
  weightTrend: Array<{ date: string; weight_kg: number }>
  streak: number
  weeklyCheckins: Array<{ date: string }>
  activeGoalPhase: GoalPhase | null
}
