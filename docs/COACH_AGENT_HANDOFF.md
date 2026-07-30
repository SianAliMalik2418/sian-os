# Sian OS — Coach Agent Handoff

> Last updated: 2026-07-30

This is the operating guide for an external wellness coach that can use the Sian OS HTTP API and the owner's Cloudflare account.

For the owner's personal profile, goals, coaching rules, current training phase, Hevy decision, and dated decision history, read the canonical [`FITNESS_COACHING_CONTEXT.md`](./FITNESS_COACHING_CONTEXT.md) first.

## Purpose

Sian OS is a single-user wellness operating system for:

- daily check-ins;
- sleep, hydration, protein, body-weight, and meal tracking;
- progress photos inside the daily check-in flow;
- daily, weekly, and monthly reports with charts and date ranges;
- structured context for an external coaching agent.

Sian OS does **not** track workouts, exercises, sets, or strength records.

## Access and privacy

Sian OS intentionally has no authentication.

- The web application and all API routes are public.
- Reads, writes, deletes, exports, backups, and progress-photo retrieval are public.
- Do not send an authorization header to the Sian OS API.
- Never put credentials, tokens, or unnecessary private medical information in payloads.
- Cloudflare credentials are separate administrative credentials. Never print, commit, or send them to Sian OS.

Treat all body and photo data as sensitive despite the intentionally public configuration.

## Production and Cloudflare inventory

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
| R2 binding | `FILES` |
| R2 bucket | `sian-os-files` |
| Worker compatibility date | `2026-07-29` |
| Worker compatibility flag | `nodejs_compat` |

Supply Cloudflare credentials through the coach's secure environment, normally as `CLOUDFLARE_API_TOKEN`. Never add the value to this repository.

## Normal coaching workflow

At the beginning of a session:

1. Fetch `/api/health`.
2. Fetch `/api/agent/context`.
3. Check `generatedAt`, recent dates, and whether today's check-in exists.
4. Base observations on recorded facts.
5. Ask for missing measurements or subjective information.
6. Ask before destructive operations.
7. Write only confirmed information.
8. Re-read the affected endpoint after writing.
9. Summarize what changed and what remains uncertain.

```bash
export SIAN_OS_URL="https://sian-os.sianalimalik2418.workers.dev"
curl -sS "$SIAN_OS_URL/api/health"
curl -sS "$SIAN_OS_URL/api/agent/context"
```

Do not invent body weight, food intake, sleep times, symptoms, or subjective scores. Omit unknown optional fields rather than sending guesses or zeroes.

## API conventions

Successful JSON response:

```json
{ "ok": true, "data": {} }
```

Error response:

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

Formats and units:

- dates: `YYYY-MM-DD`;
- sleep/wake times: `HH:mm` using 24-hour time;
- weight: kilograms;
- water: liters;
- protein: grams;
- optional text: generally limited to 2,000 characters.

## Read endpoints

| Method | Path | Result |
| --- | --- | --- |
| `GET` | `/api/health` | Application health |
| `GET` | `/api/agent/context` | Preferred full coaching context |
| `GET` | `/api/dashboard` | Latest check-in, streak, week completion, and weight trend |
| `GET` | `/api/profile` | Owner profile and goals |
| `GET` | `/api/checkins?limit=30` | Recent check-ins; limit 1–365 |
| `GET` | `/api/checkins?date=YYYY-MM-DD` | One check-in or `null` |
| `GET` | `/api/reports?interval=monthly&from=2026-01-01&to=2026-12-31` | Report summary and daily, weekly, or monthly points |
| `GET` | `/api/progress-photos` | Progress-photo metadata |
| `GET` | `/api/progress-photos/:id` | Original image streamed through the app |
| `GET` | `/api/export` | Complete versioned JSON export |

Bounded query modes:

```text
GET /api/agent/query?mode=dashboard
```

There is deliberately no public arbitrary-SQL endpoint.

## Writes

### Daily check-in

`POST /api/checkins` upserts by date. Read the existing row before correcting it because omitted optional values are cleared.

```json
{
  "date": "2026-08-01",
  "weight_kg": 72.4,
  "sleep_time": "23:30",
  "wake_time": "07:00",
  "water_liters": 2.5,
  "protein_grams": 145,
  "nutrition_notes": "Breakfast: eggs\nLunch: daal\nDinner: chicken",
  "notes": "Normal day"
}
```

Rules:

- `date` is required and unique;
- `weight_kg` is greater than 0 and at most 500;
- sleep and wake times must both be supplied or both omitted;
- `sleep_hours` must not be sent; the server calculates it;
- `23:30` to `07:00` becomes `7.5` hours;
- `water_liters` is 0–30;
- `protein_grams` is an integer from 0–2000;
- `nutrition_notes` is optional text, normally organized under Breakfast, Lunch, and Dinner;
- there are no readiness or mood fields;
- `DELETE /api/checkins?date=YYYY-MM-DD` permanently removes one check-in but keeps photos for that date.

### Profile

`PUT /api/profile` upserts profile fields. Read the existing profile first because omitted fields become `null`.

Supported fields: `height_cm`, `weight_kg`, `age`, `goals`, `experience_level`, `training_style`, `gym_schedule`, `equipment`, `injuries`, and `long_term_vision`.

### Reports

Reports are derived read-only views; they are not saved as separate records. `GET /api/reports` accepts optional `from` and `to` dates plus `interval=daily|weekly|monthly`. It returns summary averages and aggregated points for weight, sleep, water, protein, and check-in coverage.

### Progress photo

`POST /api/progress-photos` uses multipart form data with required `date` and `photo`, plus optional `label` and `notes`.

- Images only.
- Maximum 15 MB.
- `DELETE /api/progress-photos/:id` permanently deletes both the R2 object and D1 metadata.

### Export and backup

- `GET /api/export` downloads `sian-os-export`, version `4`.
- `POST /api/export` writes a timestamped JSON snapshot under `backups/` in R2.
- Exported progress-photo records do not include original image bytes.

## Data model

- `profile`: singleton owner profile where `id = 1`.
- `daily_checkins`: one row per date with weight, sleep times, calculated duration, water, protein, nutrition text, and general notes.
- `progress_photos`: D1 metadata and private R2 object key.
- `agent_audit_log`: API write history with action, entity type, entity ID, payload, and timestamp.

Reports are calculated from existing daily data rather than stored in a report table. Migration `0006_replace_weekly_reviews_with_reports.sql` removes the retired weekly-review table. Migration `0007_profile_checkin_nutrition_remove_progress.sql` moves meal notes into check-ins and removes the retired body-measurement and separate nutrition tables. Both are local-only until explicitly approved for production.

## Calculated metrics

- Daily streak uses consecutive UTC dates and may anchor on yesterday when today is incomplete.
- Weeks start Monday in UTC.
- Sleep duration rolls wake time into the next day when it is earlier than or equal to sleep time.
- Weekly reports use Monday-based UTC periods; monthly reports use calendar months.
- Report averages ignore missing values rather than treating them as zero.
- Report points are derived directly from daily check-ins.

These are product heuristics, not clinical judgments.

## Cloudflare operations

Prefer the application API because it validates input and writes the audit log. Use direct D1 access only for migrations, inspection, approved repair, and backups.

Never make a destructive Cloudflare change without describing the resource and receiving explicit owner approval.

Inspect remote migrations:

```bash
npx wrangler d1 migrations list sian-os-db --remote
```

Read-only D1 query:

```bash
npx wrangler d1 execute sian-os-db --remote \
  --command "SELECT date, weight_kg, sleep_hours FROM daily_checkins ORDER BY date DESC LIMIT 10"
```

Cloudflare REST D1 endpoint:

```text
POST /accounts/5b09b3f3dac5e3e6ca0e40cc37eed282/d1/database/c96ee3c8-9aab-4b6f-8620-771cc3dbd63a/query
```

Send the Cloudflare token only in the Cloudflare `Authorization: Bearer ...` header. Parameterize values rather than concatenating untrusted text into SQL.

Backup before risky changes:

```bash
curl -sS -X POST "$SIAN_OS_URL/api/export"
mkdir -p backups
npx wrangler d1 export sian-os-db --remote \
  --output "backups/sian-os-db-before-change.sql"
```

The `backups/` directory is ignored by Git.

Migration rules:

1. Never edit a migration already applied remotely.
2. Add the next zero-padded migration under `migrations/`.
3. Apply locally with `npm run db:local`.
4. Test against the migrated local schema.
5. Back up production.
6. Show destructive SQL and ask for approval.
7. Apply with `npm run db:remote`.
8. Deploy compatible code immediately.
9. Verify migration history, schema, routes, and representative reads.

## Codebase map

| Path | Purpose |
| --- | --- |
| `src/routes/_app/index.tsx` | Dashboard |
| `src/routes/_app/profile.tsx` | Editable owner profile |
| `src/components/daily-checkin-dialog.tsx` | Global check-in, nutrition, and progress-photo dialog |
| `src/components/ui/date-picker.tsx` | Shared Date Picker |
| `src/routes/_app/reports.tsx` | Date-ranged reports with daily edit/delete controls |
| `src/components/dither-kit/` | Dither Kit chart engine and components |
| `src/routes/api/` | Public API routes |
| `src/lib/schemas.ts` | Zod write contracts |
| `src/lib/db.ts` | D1 queries and audit writes |
| `src/lib/metrics.ts` | Sleep, streak, and week calculations |
| `src/lib/types.ts` | Core application types |
| `migrations/` | Append-only D1 migrations |
| `wrangler.jsonc` | Worker, D1, and R2 bindings |

Stack: React 19, TanStack Start/Router, TypeScript, Vite, Cloudflare Workers, D1, R2, Coss UI, Dither Kit, Zod, and Vitest.

## Development and deployment

Use exactly:

```bash
npm run dev
```

Checks:

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

## Product invariants

1. The app and APIs remain public with no authentication.
2. Check-in remains a global dialog; `/check-in` does not exist.
3. The experience remains mobile-first.
4. Use Coss UI and the shared Date Picker instead of native date inputs.
5. Mood and readiness do not belong in the UI, API, types, or database.
6. Sleep duration is calculated from sleep and wake times.
7. Workout tracking, body-measurement tracking, separate nutrition logs, and weekly-review journaling do not belong in the product.
8. Nutrition text and progress-photo management remain inside the daily check-in dialog.
9. Reports remain derived from source records and use Dither Kit charts.
10. API inputs remain strict and validated.
11. There is no arbitrary-SQL public endpoint.
12. Migrations remain append-only.
13. Back up before risky production changes.
14. Never fabricate or silently overwrite personal data.

## Known limitations

- Deleting a check-in does not delete progress photos for its date.
- There is no import/restore API.
- R2 JSON backups do not embed original progress-photo bytes.
- Public access cannot reliably identify who made a write; the audit log records actions, not authenticated identity.

When uncertain, read first, preserve data, ask one clear question, and choose the least destructive action.
