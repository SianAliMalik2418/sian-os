# Sian OS Agent API

## Access

The API is intentionally public and requires no authentication or authorization header.

```bash
export SIAN_OS_URL="https://sian-os.sianalimalik2418.workers.dev"
curl -sS "$SIAN_OS_URL/api/agent/context"
```

All read, write, edit, delete, export, backup, and progress-photo endpoints are public. Do not send credentials because the API does not use them.

## Response contract

Successful JSON endpoints return:

```json
{ "ok": true, "data": {} }
```

Errors use an HTTP error status and a stable shape:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {}
  }
}
```

Dates use `YYYY-MM-DD` and sleep/wake times use 24-hour `HH:mm`. Sleep duration is calculated by the server. Weights are kilograms, measurements are centimeters, water is liters, and durations are minutes unless named `*_seconds`. Omit unknown optional fields; do not invent data.

## Read endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/agent/context` | Profile plus recent check-ins, workouts/sets, body, nutrition, reviews, and dashboard |
| GET | `/api/dashboard` | Latest check-in, streak, current week, recent workouts, records, and weight trend |
| GET | `/api/profile` | Personal profile and goals |
| GET | `/api/checkins?limit=30` | Recent daily check-ins (max 365) |
| GET | `/api/checkins?date=2026-08-01` | One date, or `null` |
| GET | `/api/workouts?limit=30` | Recent workout summaries |
| GET | `/api/workouts/:id` | Workout with all sets |
| GET | `/api/exercises` | Exercise library and record summaries |
| GET | `/api/exercises/:id` | Exercise records and full recent set history |
| GET | `/api/body-measurements` | Body progress history |
| GET | `/api/nutrition` | Nutrition and hydration logs |
| GET | `/api/weekly-reviews` | Saved weekly reviews |
| GET | `/api/progress-photos` | Progress-photo metadata |

For bounded queries, use `/api/agent/query` with one explicit mode:

- `?mode=dashboard`
- `?mode=weekly-reviews`
- `?mode=body-progress`
- `?mode=exercise-history&exerciseId=1`

Arbitrary SQL is never accepted.

## Write a daily check-in

`POST /api/checkins` upserts by `date`, so retrying the same date updates rather than duplicates.

```bash
curl -sS -X POST "$SIAN_OS_URL/api/checkins" \
  -H "Content-Type: application/json" \
  --data '{
    "date": "2026-08-01",
    "weight_kg": 72.4,
    "sleep_time": "23:30",
    "wake_time": "07:00",
    "water_liters": 2.5,
    "protein_grams": 145,
    "notes": "Ready to train"
  }'
```

## Write a workout

Exercise names are reused case-insensitively. Set order is represented by `set_number`.

```bash
curl -sS -X POST "$SIAN_OS_URL/api/workouts" \
  -H "Content-Type: application/json" \
  --data '{
    "date": "2026-08-01",
    "title": "Upper strength",
    "program": "Block A",
    "duration_minutes": 62,
    "sets": [
      { "exercise": "Bench Press", "muscle_group": "Chest", "set_number": 1, "weight_kg": 80, "reps": 6, "rpe": 8, "rest_seconds": 180 },
      { "exercise": "Bench Press", "set_number": 2, "weight_kg": 80, "reps": 5, "rir": 2, "rest_seconds": 180 }
    ]
  }'
```

Use `PUT /api/workouts/:id` with the complete workout body to replace a workout and its sets. `DELETE /api/workouts/:id` permanently deletes it.

## Other writes

- `PUT /api/profile` — upsert profile fields.
- `POST /api/body-measurements` — append dated weight and circumference measurements.
- `POST /api/nutrition` — append meal, protein, water, supplements, consistency, and notes.
- `POST /api/weekly-reviews` — recompute a week from D1 and save subjective fields.
- `POST /api/progress-photos` — multipart form with `date`, `photo`, optional `label`, and optional `notes`; maximum 15 MB image.
- `POST /api/export` — create a timestamped R2 JSON backup.

Public API writes are audit logged with action, entity type/id, payload, and timestamp.

## Agent safety rules

1. Read context before coaching or writing.
2. Ask the user before destructive operations.
3. Do not infer health measurements or subjective scores.
4. Retry check-ins safely by date; avoid retrying append-only endpoints without checking whether the write succeeded.
5. Treat this as fitness tracking, not medical diagnosis.
