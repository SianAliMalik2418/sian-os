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

Dates use `YYYY-MM-DD` and sleep/wake times use 24-hour `HH:mm`. Sleep duration is calculated by the server. Weight is kilograms, water is liters, protein is grams, and calories are estimated kcal. Omit unknown optional fields; do not invent data.

## Read endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/agent/context` | Profile, recent check-ins, and dashboard |
| GET | `/api/agent/state?key=last_weekly_report_date` | Weekly-report cadence state |
| GET | `/api/dashboard` | Latest check-in, streak, current week, and weight trend |
| GET | `/api/profile` | Personal profile and goals |
| GET | `/api/checkins?limit=30` | Recent daily check-ins (max 365) |
| GET | `/api/checkins?date=2026-08-01` | One date, or `null` |
| GET | `/api/reports?interval=weekly&from=2026-01-01&to=2026-12-31` | Daily, weekly, or monthly report points and summary |
| GET | `/api/progress-photos` | Progress-photo metadata |

For bounded queries, use `/api/agent/query` with one explicit mode:

- `?mode=dashboard`

Arbitrary SQL is never accepted.

## Write a daily check-in

`POST /api/checkins` upserts by `date`, so retrying the same date updates rather than duplicates. Read an existing row before updating because omitted optional values are cleared.

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
    "calories": 2400,
    "nutrition_notes": "Breakfast: eggs\nLunch: daal\nDinner: chicken",
    "workout_text": "Lower session completed in Hevy; brief summary only.",
    "notes": "Normal day"
  }'
```

Field notes:

- `nutrition_notes` is free text for formatted meals, snacks, drinks, and practical portion notes.
- `workout_text` is free text for daily workout status or a brief summary. Hevy remains authoritative for exercises, sets, reps, loads, RPE/RIR, routines, and progression.
- `calories` is an optional integer estimate in kcal.

`DELETE /api/checkins?date=YYYY-MM-DD` permanently removes one daily check-in. Progress photos on that date are retained.

## Other writes

- `PUT /api/agent/state` — upsert limited agent state, currently only `{ "key": "last_weekly_report_date", "value": "YYYY-MM-DD" }`; send `null` to clear it.
- `PUT /api/profile` — upsert profile fields.
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

For daily logging, parse natural language into one `/api/checkins` upsert, then verify by date. For analysis, fetch recent check-ins and use the latest completed/logged day unless the owner specifies another date. Include weekly analysis only through the cadence rule above.

## Agent safety rules

1. Read context before coaching or writing.
2. Ask the user before destructive operations.
3. Do not infer health measurements or subjective scores.
4. Retry check-ins safely by date; verify photo uploads before retrying.
5. Treat this as wellness tracking, not medical diagnosis.
6. For weekly reports, fetch recent check-ins and include a weekly summary only when at least seven newer logged days exist since `last_weekly_report_date`.
