# Sian OS — Coach Agent Handoff

> Last verified: 2026-07-30
>
> This is the standalone operating guide for an external fitness-coach agent that can use both the Sian OS HTTP API and the owner's Cloudflare account.

## 1. Purpose

Sian OS is a single-user personal fitness operating system for:

- daily check-ins;
- sleep, hydration, protein, and body-weight tracking;
- workouts, exercises, sets, and strength history;
- body measurements and nutrition logs;
- progress photos;
- weekly reviews;
- structured context for an external coaching agent.

The coach should use the data to help the owner become stronger, healthier, and more consistent. It is a fitness-tracking and planning tool, not a medical diagnosis system.

## 2. Critical access and privacy model

Sian OS intentionally has **no authentication**.

- The web application is public.
- Every API route is public.
- Reads, writes, edits, deletes, exports, backups, and progress-photo retrieval are public.
- Do not send an authorization header to the Sian OS API.
- Do not put secrets, API tokens, private medical information, or credentials in notes or API payloads.
- Cloudflare credentials are separate administrative credentials. Never print, commit, or send those credentials to Sian OS.

Because writes are public, always re-read data after a write and report unexpected changes to the owner.

## 3. Production and Cloudflare inventory

| Resource | Value |
| --- | --- |
| GitHub repository | `https://github.com/SianAliMalik2418/sian-os` |
| Git branch | `main` |
| Production Worker | `sian-os` |
| Production URL | `https://sian-os.sianalimalik2418.workers.dev` |
| Cloudflare account ID | `5b09b3f3dac5e3e6ca0e40cc37eed282` |
| D1 binding | `DB` |
| D1 database | `sian-os-db` |
| D1 database ID | `c96ee3c8-9aab-4b6f-8620-771cc3dbd63a` |
| D1 region | APAC |
| R2 binding | `FILES` |
| R2 bucket | `sian-os-files` |
| R2 region | APAC |
| Worker compatibility date | `2026-07-29` |
| Worker compatibility flag | `nodejs_compat` |

The Cloudflare token must be supplied through the agent's secure environment, normally as `CLOUDFLARE_API_TOKEN`. Never add it to this repository or a request payload.

### Legacy Worker secrets

Cloudflare currently reports legacy secret bindings named `AGENT_API_TOKEN`, `APP_PASSWORD`, and `SESSION_SECRET`. Their values are not documented and must not be exposed. The target application does not use them because the app and API are intentionally public. They may be removed in a separately approved cleanup after the new public build is deployed and verified.

## 4. Deployment status

The target application and database schema are deployed.

Verified on 2026-07-30:

- Git `HEAD` is `ed3760f`, with the deployed feature work still uncommitted in the local working tree.
- Production Worker version `780e221b-9f85-413d-a467-72f753a02908` receives 100% of traffic.
- Production D1 has migrations `0001_initial.sql` through `0004_sleep_times_remove_mood.sql` applied.
- Readiness and mood fields have been removed from the production schema and API.
- Check-ins accept `sleep_time` plus `wake_time`; `sleep_hours` is calculated server-side.
- The separate check-in page is removed and returns 404; check-in uses the global mobile-first dialog.
- The shared Coss/Shadcn-composed Date Picker is used throughout the app.
- Health, dashboard, context, check-in, workouts, progress, and weekly-review production reads passed after deployment.

The target API contract documented below is active in production.

## 5. Normal coach workflow

Use the Sian OS HTTP API for ordinary coaching. Direct Cloudflare access is for deployment, migrations, backups, inspection, and exceptional repair—not routine logging.

At the beginning of a coaching session:

1. Fetch `GET /api/health`.
2. Fetch `GET /api/agent/context`.
3. Check `generatedAt`, recent dates, and whether today's check-in already exists.
4. Base advice on recorded facts, not assumptions.
5. Ask the owner for any missing subjective or measured information.
6. Ask for confirmation before destructive actions or replacing a workout.
7. Write only confirmed data.
8. Re-read the affected endpoint and verify the result.
9. Summarize what was written and what remains uncertain.

Quick start:

```bash
export SIAN_OS_URL="https://sian-os.sianalimalik2418.workers.dev"
curl -sS "$SIAN_OS_URL/api/health"
curl -sS "$SIAN_OS_URL/api/agent/context"
```

Do not invent measurements, workout performance, sleep times, symptoms, or subjective scores. Omit unknown optional fields rather than sending guesses or zeroes.

## 6. API conventions

### Successful JSON response

```json
{
  "ok": true,
  "data": {}
}
```

Some successful delete responses contain only `{ "ok": true }`.

### Error response

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

Use the HTTP status and `error.code`; do not parse human-readable messages as a stable protocol.

### Units and formats

- Dates: `YYYY-MM-DD`.
- Sleep and wake times: 24-hour `HH:mm`.
- Weight: kilograms.
- Circumference: centimeters.
- Water: liters.
- Protein: grams.
- Workout duration: minutes.
- Rest: seconds.
- RPE: 0–10.
- RIR: 0–20.
- Text fields: trimmed and generally limited to 2,000 characters.
- JSON endpoints default to `Cache-Control: no-store`.

## 7. Read endpoints

| Method | Path | Result |
| --- | --- | --- |
| `GET` | `/api/health` | Basic application health |
| `GET` | `/api/agent/context` | Preferred full coaching context |
| `GET` | `/api/dashboard` | Latest check-in, streak, week completion, workouts, PRs, trends |
| `GET` | `/api/profile` | Owner profile and goals |
| `GET` | `/api/checkins?limit=30` | Recent check-ins; limit is clamped to 1–365 |
| `GET` | `/api/checkins?date=YYYY-MM-DD` | One check-in or `null` |
| `GET` | `/api/workouts?limit=30` | Workout summaries; limit is clamped to 1–200 |
| `GET` | `/api/workouts/:id` | One workout with ordered sets |
| `GET` | `/api/exercises` | Exercise library and aggregate records |
| `GET` | `/api/exercises/:id` | Exercise details, records, and up to 200 history rows |
| `GET` | `/api/body-measurements` | Up to 365 recent measurements |
| `GET` | `/api/nutrition` | Up to 365 recent nutrition logs |
| `GET` | `/api/weekly-reviews` | Up to 104 weekly reviews |
| `GET` | `/api/progress-photos` | Up to 500 photo metadata records |
| `GET` | `/api/progress-photos/:id` | Original image streamed from private R2 through the public app |
| `GET` | `/api/export` | Complete versioned JSON export |

`GET /api/agent/context` returns:

- `generatedAt`;
- `profile`;
- `dashboard`;
- 30 recent check-ins;
- 30 recent workouts and their sets;
- 30 recent body measurements;
- 60 recent nutrition records;
- 12 weekly reviews.

For smaller bounded queries, use one explicit mode:

```text
GET /api/agent/query?mode=dashboard
GET /api/agent/query?mode=weekly-reviews
GET /api/agent/query?mode=body-progress
GET /api/agent/query?mode=exercise-history&exerciseId=1
```

There is deliberately no public arbitrary-SQL endpoint.

## 8. Write endpoints and payloads

### Daily check-in — target contract after migrations 0003/0004

`POST /api/checkins` upserts by date. A retry for the same date replaces all optional check-in values with the supplied values or `null`, so first read the existing row before making a partial correction.

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
    "notes": "Normal training day"
  }'
```

Rules:

- `date` is required and unique.
- `weight_kg`: greater than 0 and at most 500.
- `sleep_time` and `wake_time` must either both be supplied or both be omitted.
- `sleep_hours` must not be sent; the server calculates it.
- Overnight sleep is supported. `23:30` to `07:00` becomes `7.5` hours.
- `water_liters`: 0–30.
- `protein_grams`: integer, 0–2000.
- There are no readiness, recovery, mood, energy, motivation, soreness, stress, or sleep-quality fields in the target model.

### Workout

Create:

```bash
curl -sS -X POST "$SIAN_OS_URL/api/workouts" \
  -H "Content-Type: application/json" \
  --data '{
    "date": "2026-08-01",
    "title": "Upper strength",
    "program": "Block A",
    "duration_minutes": 62,
    "notes": "Optional session note",
    "sets": [
      {
        "exercise": "Bench Press",
        "muscle_group": "Chest",
        "set_number": 1,
        "weight_kg": 80,
        "reps": 6,
        "rpe": 8,
        "rest_seconds": 180
      },
      {
        "exercise": "Bench Press",
        "set_number": 2,
        "weight_kg": 80,
        "reps": 5,
        "rir": 2,
        "rest_seconds": 180
      }
    ]
  }'
```

- `POST /api/workouts` creates a workout.
- `PUT /api/workouts/:id` replaces the complete workout and all its sets. Always fetch first and send the complete desired state.
- `DELETE /api/workouts/:id` permanently deletes the workout and its sets.
- Exercise names are reused case-insensitively.
- `set_number` is a positive integer up to 100.
- A workout may contain at most 200 sets.

### Profile

`PUT /api/profile` replaces/upserts profile fields:

```json
{
  "height_cm": 180,
  "weight_kg": 80,
  "age": 30,
  "goals": "Build strength consistently",
  "experience_level": "Intermediate",
  "training_style": "Strength and hypertrophy",
  "gym_schedule": "Four sessions per week",
  "equipment": "Commercial gym",
  "injuries": "Only owner-confirmed information",
  "long_term_vision": "Durable long-term strength"
}
```

Read the current profile first because omitted fields are stored as `null`.

### Body measurement

`POST /api/body-measurements` appends a new row:

```json
{
  "date": "2026-08-01",
  "weight_kg": 72.4,
  "chest_cm": 100.2,
  "waist_cm": 82.1,
  "hips_cm": 98.5,
  "arm_cm": 36.4,
  "thigh_cm": 58.2,
  "notes": "Morning measurement"
}
```

### Nutrition log

`POST /api/nutrition` appends a new row:

```json
{
  "date": "2026-08-01",
  "meal": "Daily summary",
  "protein_grams": 145,
  "water_liters": 2.5,
  "supplements": "Owner-confirmed supplements only",
  "consistency": 8,
  "notes": "Optional note"
}
```

`consistency` is an integer from 1–10.

### Weekly review

`POST /api/weekly-reviews` upserts by `week_start`:

```json
{
  "week_start": "2026-07-27",
  "missed_workouts": 1,
  "wins": "Added one rep on bench press",
  "lessons": "Recovery was better after earlier sleep",
  "focus_next_week": "Keep loads stable and improve execution"
}
```

The server recomputes:

- workouts completed during the seven-day period;
- first-to-last check-in weight change;
- average nutrition consistency;
- hydration consistency;
- highest-volume workout as the best workout.

Prefer a Monday for `week_start` because the UI and dashboard use Monday-based weeks.

### Progress photo

`POST /api/progress-photos` uses multipart form data:

```bash
curl -sS -X POST "$SIAN_OS_URL/api/progress-photos" \
  -F "date=2026-08-01" \
  -F "label=Front" \
  -F "notes=Monthly comparison" \
  -F "photo=@/path/to/photo.jpg"
```

- Images only.
- Maximum size: 15 MB.
- The object is written to R2 under `progress/YYYY-MM-DD/<uuid>.<extension>`.
- D1 stores metadata and the R2 key.
- `DELETE /api/progress-photos/:id` permanently deletes both the R2 object and D1 metadata.

### Backup/export

- `GET /api/export` downloads all D1 data as `sian-os-export`, version `1`.
- `POST /api/export` stores a JSON snapshot in R2 under `backups/<timestamp>.json`.
- Export metadata includes progress-photo records, not original image bytes.

## 9. Data model after migrations 0003/0004

### `profile`

Singleton row where `id = 1`: height, weight, age, goals, experience level, training style, schedule, equipment, injuries, long-term vision, and update time.

### `daily_checkins`

One row per date: weight, sleep time, wake time, calculated sleep hours, water, protein, notes, and timestamps.

### `exercises`

Case-insensitively unique exercise names with optional muscle group, equipment, and notes.

### `workouts`

Dated session title, optional program, duration, notes, and creation time.

### `workout_sets`

Workout/exercise links with set number, reps, weight, RPE, RIR, rest seconds, and notes. Workout deletion cascades logically through the application and foreign-key relationship.

### `body_measurements`

Append-only dated weight and chest, waist, hip, arm, and thigh measurements.

### `nutrition_logs`

Append-only dated meal/summary, protein, water, supplements, consistency, and notes.

### `progress_photos`

Dated R2 object key plus label, notes, and creation time.

### `weekly_reviews`

Unique week start plus computed statistics and owner/coach reflection fields.

### `agent_audit_log`

API write history with action, entity type, entity ID, JSON payload, and timestamp. Direct D1 changes do not automatically appear here.

## 10. Calculated metrics

- Daily streak checks consecutive UTC dates. If today is missing, yesterday may still anchor the streak.
- Weekly dashboard periods start Monday in UTC.
- Sleep duration is calculated from sleep/wake clock times and rolls wake time into the next day when it is earlier than or equal to sleep time.
- Estimated 1RM uses the Epley formula: `weight × (1 + reps / 30)`.
- Dashboard PRs are ordered by estimated 1RM.
- Weekly best workout is the session with the greatest sum of `weight_kg × reps`.
- Hydration consistency maps 2 L or more to 10; lower values are multiplied by 5 before averaging.

These are product heuristics, not clinical judgments.

## 11. Cloudflare operating guide

### Principle

Prefer the application API because it validates inputs and writes `agent_audit_log`. Use direct D1 only when:

- checking migrations or schema;
- creating a backup;
- investigating integrity;
- performing an owner-approved repair;
- deploying a schema/code change not possible through the product API.

Never make a destructive Cloudflare change without describing the exact resource/action and receiving explicit owner approval.

### Verify Cloudflare access

The token needs the appropriate account-level Worker, D1, and R2 permissions. Verify account and resources before changing anything. Do not log token values.

### Inspect remote migrations

From the repository root:

```bash
npx wrangler d1 migrations list sian-os-db --remote
```

Or query D1's migration table read-only:

```bash
npx wrangler d1 execute sian-os-db --remote \
  --command "SELECT id, name, applied_at FROM d1_migrations ORDER BY id"
```

### Read-only D1 inspection

```bash
npx wrangler d1 execute sian-os-db --remote \
  --command "SELECT date, weight_kg, sleep_hours FROM daily_checkins ORDER BY date DESC LIMIT 10"
```

When using Cloudflare's REST API directly:

```text
POST /accounts/5b09b3f3dac5e3e6ca0e40cc37eed282/d1/database/c96ee3c8-9aab-4b6f-8620-771cc3dbd63a/query
```

Send the Cloudflare token only in the Cloudflare `Authorization: Bearer ...` header. Parameterize data values; do not concatenate untrusted text into SQL.

### Backup before migrations or repair

Create an application JSON/R2 backup:

```bash
curl -sS -X POST "$SIAN_OS_URL/api/export"
```

Also create a D1 SQL export for risky schema work:

```bash
mkdir -p backups
npx wrangler d1 export sian-os-db --remote \
  --output "backups/sian-os-db-before-change.sql"
```

Do not commit backups because they contain personal data.

### Migration discipline

- Migration files are append-only.
- Never edit a migration already applied remotely.
- Add the next zero-padded migration under `migrations/`.
- Apply locally first with `npm run db:local`.
- Test against the local schema.
- Back up production.
- Show the owner any destructive SQL before applying it.
- Apply production migrations with `npm run db:remote` only after approval.
- Deploy compatible code immediately after a schema-breaking migration.
- Recheck `d1_migrations`, table schema, health, and representative reads/writes.

Direct SQL maintenance should use transactions where D1 supports the operation. After an owner-approved direct write, verify affected rows and add an audit record or maintenance note so the change remains explainable.

## 12. Migration/deployment runbook

Migrations 0003 and 0004 were applied on 2026-07-30. They rebuilt tables and permanently removed readiness/mood columns. The following sequence records the release process and should be adapted for future destructive migrations.

Recommended release sequence:

1. Review and commit the current working tree.
2. Run all checks.
3. Confirm production is healthy.
4. Create both JSON/R2 and D1 SQL backups.
5. Confirm only migrations 0003 and 0004 are pending.
6. Inform the owner that check-in writes may briefly fail during the schema/code cutover.
7. With explicit approval, apply `npm run db:remote`.
8. Immediately run `npm run deploy`.
9. Verify `/api/health`, `/`, `/workouts`, `/progress`, and `/weekly-review`.
10. Fetch `/api/checkins?limit=1`; confirm `sleep_time` and `wake_time` exist and readiness/mood fields do not.
11. Perform an owner-approved check-in smoke test or use a disposable date, then verify and remove/restore it carefully.
12. Re-fetch `/api/agent/context` and confirm the new contract.

Migration effects on historical data:

- Existing weight, calculated sleep hours, water, protein, notes, IDs, and timestamps are retained.
- Old readiness/recovery-related fields are dropped by migration 0003.
- Mood is dropped by migration 0004.
- Historical rows retain `sleep_hours`, but `sleep_time` and `wake_time` are `null` because exact old clock times cannot be reconstructed safely.

## 13. Codebase map

| Path | Purpose |
| --- | --- |
| `src/routes/_app/index.tsx` | Dashboard |
| `src/components/daily-checkin-dialog.tsx` | Global mobile-first check-in dialog |
| `src/components/ui/date-picker.tsx` | Shared Coss/Shadcn-composed Date Picker |
| `src/routes/_app/workouts.tsx` | Workout creation/edit/history |
| `src/routes/_app/exercises.tsx` | Exercise library |
| `src/routes/_app/exercises.$exerciseId.tsx` | Exercise history and records |
| `src/routes/_app/progress.tsx` | Body, nutrition, and progress photos |
| `src/routes/_app/weekly-review.tsx` | Weekly review UI |
| `src/routes/api/` | Public API routes |
| `src/lib/schemas.ts` | Zod write contracts and limits |
| `src/lib/db.ts` | D1 queries, dashboard summary, audit writes |
| `src/lib/metrics.ts` | Sleep, streak, week, 1RM, progression calculations |
| `src/lib/types.ts` | Core application types |
| `migrations/` | Append-only D1 schema migrations |
| `wrangler.jsonc` | Worker, D1, and R2 bindings |
| `docs/AGENT_API.md` | Short API reference |

Technology stack:

- React 19;
- TanStack Start/Router;
- TypeScript;
- Vite;
- Cloudflare Workers;
- Cloudflare D1;
- Cloudflare R2;
- Coss UI components;
- Shadcn Date Picker composition using the existing Coss Calendar/Popover;
- Zod validation;
- Vitest.

## 14. Development and release commands

Use exactly this for local development:

```bash
npm run dev
```

Initial setup:

```bash
npm ci
npm run db:local
npm run dev
```

Required checks before commit or deployment:

```bash
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

Deployment:

```bash
npm run db:remote
npm run deploy
```

The database migration must be reviewed and approved before running the remote command when it is destructive.

## 15. Product invariants

Do not violate these without explicit owner direction:

1. The app and APIs remain completely public with no authentication.
2. There is no separate `/check-in` page; check-in is a global dialog.
3. The experience remains mobile-first.
4. Use Coss UI components and the shared Date Picker rather than native date inputs.
5. Mood and readiness fields do not belong in the target UI, API, types, or database.
6. Sleep duration is calculated from sleep and wake times; it is not user-entered.
7. Exercise names are reused case-insensitively.
8. API inputs remain validated and strict.
9. There is no arbitrary-SQL public endpoint.
10. Migrations remain append-only.
11. Back up before risky production changes.
12. Never silently fabricate or overwrite personal fitness data.

## 16. Coach safety rules

- Be clear about which observations come from data and which are suggestions.
- Do not diagnose injuries, sleep disorders, eating disorders, or medical conditions.
- Recommend qualified medical help for concerning symptoms or acute injuries.
- Avoid aggressive progression recommendations based on one session.
- Consider recent sleep, workload, RPE/RIR, and trend data together.
- Ask before deleting photos or workouts or directly editing D1.
- Treat body and photo data as sensitive even though the owner intentionally configured public access.
- If API data conflicts with direct D1 data, stop and investigate deployment/schema mismatch before writing.

## 17. Known limitations

- Body measurement and nutrition endpoints append rows and currently have no edit/delete API.
- Check-ins have no delete API but upsert by date.
- There is no import/restore API yet.
- R2 JSON backups do not embed original progress-photo bytes.
- The application is single-user by design.
- Public access means there is no reliable way to distinguish owner writes from third-party writes using authentication; the audit log records actions, not identity.

When uncertain, read first, preserve data, ask one clear question, and choose the least destructive action.
