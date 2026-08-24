const LYFTA_BASE_URL = 'https://my.lyfta.app'
const MAX_WORKOUT_LIMIT = 100

export interface LyftaSet {
  id: string
  weight: string | null
  reps: string | null
  rir: string | null
  duration: string | null
  distance: string | null
  completed: boolean | null
  recordType: string | null
  recordLevel: string | null
  recordValue: string | null
}

export interface LyftaExercise {
  id: string
  name: string
  type: string | null
  sets: LyftaSet[]
}

export interface LyftaWorkout {
  id: string
  title: string
  performedAt: string | null
  duration: string | null
  totalVolume: string | null
  exercises: LyftaExercise[]
}

export interface LyftaPagination {
  count: number | null
  totalRecords: number | null
  totalPages: number | null
  currentPage: number
  limit: number
}

export type LyftaWorkoutsResult =
  | { available: true; workouts: LyftaWorkout[]; pagination: LyftaPagination }
  | { available: false; reason: string; workouts: []; pagination: null }

export async function fetchLyftaWorkouts({
  apiKey,
  fetcher = fetch,
  limit = 20,
  page = 1,
}: {
  apiKey?: string
  fetcher?: typeof fetch
  limit?: number
  page?: number
}): Promise<LyftaWorkoutsResult> {
  if (!apiKey?.trim()) {
    return {
      available: false,
      reason: 'LYFTA_API_KEY is not configured',
      workouts: [],
      pagination: null,
    }
  }

  const normalizedLimit = clampWholeNumber(limit, 1, MAX_WORKOUT_LIMIT)
  const normalizedPage = clampWholeNumber(page, 1, Number.MAX_SAFE_INTEGER)
  const detailsUrl = lyftaUrl('/api/v1/workouts', normalizedLimit, normalizedPage)
  const summaryUrl = lyftaUrl('/api/v1/workouts/summary', normalizedLimit, normalizedPage)
  const headers = { Authorization: `Bearer ${apiKey}` }

  const [response, summaryResponse] = await Promise.all([
    fetcher(detailsUrl, { headers }),
    fetcher(summaryUrl, { headers }),
  ])

  if (!response.ok) {
    return {
      available: false,
      reason: `Lyfta returned HTTP ${response.status}`,
      workouts: [],
      pagination: null,
    }
  }

  const payload = asRecord(await response.json())
  const summaries = summaryResponse.ok ? summaryByWorkoutId(asRecord(await summaryResponse.json())) : new Map<string, Record<string, unknown>>()
  return {
    available: true,
    workouts: asArray(payload.workouts).map((workout) => normalizeWorkout(workout, summaries.get(text(asRecord(workout).id)))),
    pagination: {
      count: nullableNumber(payload.count),
      totalRecords: nullableNumber(payload.total_records),
      totalPages: nullableNumber(payload.total_pages),
      currentPage: nullableNumber(payload.current_page) ?? normalizedPage,
      limit: nullableNumber(payload.limit) ?? normalizedLimit,
    },
  }
}

function lyftaUrl(path: string, limit: number, page: number) {
  const url = new URL(path, LYFTA_BASE_URL)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('page', String(page))
  return url.toString()
}

function summaryByWorkoutId(payload: Record<string, unknown>) {
  const summaries = new Map<string, Record<string, unknown>>()
  for (const summary of asArray(payload.workouts)) {
    const record = asRecord(summary)
    const id = text(record.id)
    if (id) summaries.set(id, record)
  }
  return summaries
}

function normalizeWorkout(value: unknown, summary: Record<string, unknown> = {}): LyftaWorkout {
  const workout = asRecord(value)
  return {
    id: text(workout.id) || '',
    title: text(workout.title) || 'Untitled workout',
    performedAt: nullableText(workout.workout_perform_date),
    duration: nullableText(workout.workout_duration ?? summary.workout_duration),
    totalVolume: nullableText(workout.total_volume ?? workout.totalLiftedWeight ?? summary.total_volume),
    exercises: asArray(workout.exercises).map(normalizeExercise),
  }
}

function normalizeExercise(value: unknown): LyftaExercise {
  const exercise = asRecord(value)
  return {
    id: text(exercise.exercise_id) || '',
    name: text(exercise.excercise_name ?? exercise.exercise_name ?? exercise.name) || 'Unknown exercise',
    type: nullableText(exercise.exercise_type),
    sets: asArray(exercise.sets).map(normalizeSet),
  }
}

function normalizeSet(value: unknown): LyftaSet {
  const set = asRecord(value)
  return {
    id: text(set.id) || '',
    weight: nullableText(set.weight),
    reps: nullableText(set.reps),
    rir: nullableText(set.rir),
    duration: nullableText(set.duration),
    distance: nullableText(set.distance),
    completed: typeof set.is_completed === 'boolean' ? set.is_completed : null,
    recordType: nullableText(set.record_type),
    recordLevel: nullableText(set.record_level),
    recordValue: nullableText(set.record_value),
  }
}

function clampWholeNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function nullableNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

function nullableText(value: unknown) {
  const valueText = text(value)
  return valueText === '' ? null : valueText
}

function text(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}
