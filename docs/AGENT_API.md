# Sian OS Agent API

## Access

The API is intentionally public and requires no authentication or authorization header.

```bash
export SIAN_OS_URL="https://sian-os.sianalimalik2418.workers.dev"
curl -sS "$SIAN_OS_URL/api/agent/context"
```

All read, write, delete, export, backup, and progress-photo endpoints are public. Do not send credentials because the API does not use them.

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

Dates use `YYYY-MM-DD`. Sleep is logged as numeric hours. Weight is kilograms, waist is inches, water is liters, protein, fats, and carbs are grams, and calories are estimated kcal. Omit unknown optional fields; do not invent data.

## Read endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/agent/context` | Profile, recent check-ins, recent nutrition entries, dashboard, and saved recipes |
| GET | `/api/agent/state?key=last_weekly_report_date` | Weekly-report cadence state |
| GET | `/api/dashboard` | Latest check-in, streak, current week, weight trend, and profile nutrition goals |
| GET | `/api/profile` | Personal profile and goals, including editable daily calorie/protein targets |
| GET | `/api/nutrition-entries?date=2026-08-16` | Food-item rows for one date |
| GET | `/api/recipes` | Saved repeat recipes for nutrition lookup |
| GET | `/api/checkins?limit=30` | Recent daily check-ins (max 365) |
| GET | `/api/checkins?date=2026-08-01` | One date, or `null` |
| GET | `/api/reports?interval=weekly&from=2026-01-01&to=2026-12-31` | Daily, weekly, or monthly report points and summary |
| GET | `/api/progress-photos` | Progress-photo metadata |

For bounded queries, use `/api/agent/query` with one explicit mode:

- `?mode=dashboard`

Arbitrary SQL is never accepted.

## Write a daily check-in

`POST /api/checkins` upserts by `date`, so retrying the same date updates rather than duplicates. Read an existing row before updating because omitted optional values are cleared.

Today's check-in may be a running draft. When adding food during the day, prefer itemized nutrition rows so calories, protein, fats, and carbs are recalculated without overwriting other check-in fields.

Prefer `/api/nutrition-entries` for itemized food logging. Nutrition entries automatically recalculate `daily_checkins.calories`, `daily_checkins.protein_grams`, `daily_checkins.fat_grams`, and `daily_checkins.carb_grams`. For multiple servings of one saved recipe, multiply the recipe macros and put the serving count in `item_name`, such as `Bread x3`.

```bash
curl -sS -X POST "$SIAN_OS_URL/api/checkins" \
  -H "Content-Type: application/json" \
  --data '{
    "date": "2026-08-01",
    "weight_kg": 72.4,
    "waist_inches": 31.5,
    "sleep_hours": 7.5,
    "water_liters": 2.5,
    "protein_grams": 145,
    "fat_grams": 70,
    "carb_grams": 300,
    "calories": 2400,
    "workout_text": "Lower session completed in Lyfta. Exercises: Smith squat 3x8; leg extension 2x12. Notes: no joint pain.",
    "notes": "Normal day"
  }'
```

Field notes:

- `sleep_hours` is optional numeric hours slept, from 0 to 24.
- `waist_inches` is an optional waist measurement in inches.
- `protein_grams`, `fat_grams`, and `carb_grams` are optional numeric gram totals, normally recalculated from itemized nutrition rows.
- `nutrition_notes` is a legacy free-text field; do not use it for routine food logging.
- `workout_text` is free text for reviewer-facing workout notes derived from Lyfta. Lyfta remains authoritative for exercises, sets, reps, loads, RPE/RIR, routines, notes, and progression.
- `calories` is an optional numeric estimate in kcal.

`DELETE /api/checkins?date=YYYY-MM-DD` permanently removes one daily check-in. Progress photos on that date are retained.

## Other writes

- `POST /api/nutrition-entries` — add one food row with `date`, `item_name`, `calories`, and optional `protein_grams`, `fat_grams`, and `carb_grams`. Decimal values are allowed for fractional servings. This automatically updates the daily check-in nutrition totals.
- `DELETE /api/nutrition-entries/:id` — delete one food row and recalculate the daily totals.
- `PUT /api/agent/state` — upsert limited agent state, currently only `{ "key": "last_weekly_report_date", "value": "YYYY-MM-DD" }`; send `null` to clear it.
- `PUT /api/profile` — upsert profile fields, including `calorie_goal` and `protein_goal` for daily targets.
- `POST /api/recipes` and `PUT /api/recipes/:id` — multipart recipe writes with `name`, `calories`, `protein_grams`, optional `fat_grams`, `carb_grams`, `aliases`, `category`, `serving_description`, `ingredients`, `notes`, and optional image `photo`.
- `DELETE /api/recipes/:id` — permanently remove one saved recipe and its photo.
- `POST /api/progress-photos` — multipart form with `date`, `photo`, optional `label`, and optional `notes`; maximum 15 MB image.
- `DELETE /api/progress-photos/:id` — permanently remove a photo and its metadata.
- `POST /api/export` — create a timestamped R2 JSON backup.

Public API writes are audit logged with action, entity type/id, payload, and timestamp.

## Weekly report cadence

Use `GET /api/checkins?limit=30` for recent daily data. Before including a weekly report, read:

```bash
curl -sS "$SIAN_OS_URL/api/agent/state?key=last_weekly_report_date"
```

Include a weekly summary only when at least seven newer logged days exist since `last_weekly_report_date`. After giving the weekly report, store the latest date covered:

```bash
curl -sS -X PUT "$SIAN_OS_URL/api/agent/state" \
  -H "Content-Type: application/json" \
  --data '{ "key": "last_weekly_report_date", "value": "2026-08-10" }'
```

This state is for cadence only. Do not store daily logs, coaching advice, credentials, or private notes in `agent_state`.

## Agent daily loop

For daily logging, parse natural language food items into `/api/nutrition-entries` rows, then verify by date. Use `/api/checkins` for non-food daily facts such as sleep, water, waist, weight, notes, and workout text. Check saved recipes by name and aliases before estimating item calories, protein, fats, or carbs; saved recipe values override estimates when the logged item clearly matches. Multiply saved recipe macros when the owner states multiple servings and label the row with the count, such as `Bread x3`. Estimate fats and carbs only when the food context is sufficient. Use profile `calorie_goal` and `protein_goal` to calculate remaining daily intake. For analysis, fetch recent check-ins and use the latest completed/logged day unless the owner specifies another date. Include weekly analysis only through the cadence rule above.

## Agent safety rules

1. Read context before coaching or writing.
2. Ask the user before destructive operations.
3. Do not infer health measurements or subjective scores.
4. Retry check-ins safely by date; verify photo uploads before retrying.
5. Treat this as wellness tracking, not medical diagnosis.
6. For weekly reports, fetch recent check-ins and include a weekly summary only when at least seven newer logged days exist since `last_weekly_report_date`.
