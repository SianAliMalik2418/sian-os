# Sian OS — Coach Agent Handoff

> Last updated: 2026-08-14

This is the operating guide for an external wellness coach that can use the Sian OS HTTP API and the owner's Cloudflare account.

For the owner's personal profile, goals, coaching rules, current training phase, Lyfta decision, and dated decision history, read the canonical [`FITNESS_COACHING_CONTEXT.md`](./FITNESS_COACHING_CONTEXT.md) first.

Fitness operations are split between [`agents/COACH_AGENT.md`](./agents/COACH_AGENT.md) and [`agents/DATA_STEWARD_AGENT.md`](./agents/DATA_STEWARD_AGENT.md). The Coach reads and judges records but does not write them; the Data Steward writes and verifies records but does not coach. Neither role inspects source code during a fitness operation.

## Purpose

Sian OS is a single-user wellness operating system for:

- daily check-ins;
- itemized daily food rows plus running daily calories/protein/fat/carb totals, sleep, hydration, body-weight, waist, and brief workout-summary text;
- editable daily calorie and protein goals in the profile;
- saved repeat recipes with ingredients, photos, calories, protein, fats, and carbs;
- progress photos inside the daily check-in flow;
- daily, weekly, and monthly reports with charts and date ranges;
- structured context for an external coaching agent.

Sian OS does **not** own workouts, exercises, sets, loads, RPE/RIR, routines, or strength records. Lyfta owns those details. Sian OS may store reviewer-facing workout notes derived from Lyfta inside a daily check-in.

The Coach also acts as Sian's nutrition coach. Sian OS owns the recorded nutrition evidence: food notes, protein, fats, carbs, calories when estimated, water, body weight, waist, sleep, editable daily nutrition goals, and reports. Nutrition coaching is practical physique coaching, not clinical dietetics.

## Access and privacy

Sian OS intentionally has no authentication.

- The web application and all API routes are public.
- Reads, writes, deletes, exports, backups, and progress-photo retrieval are public.
- Do not send an authorization header to the Sian OS API.
- Never put credentials, tokens, or unnecessary private medical information in payloads.
- Cloudflare credentials are separate administrative credentials. Never print, commit, or send them to Sian OS.
- Lyfta API credentials are separate workout-source credentials. Store them only as secure runtime secrets, such as `LYFTA_API_KEY`; never commit, print, or write them into Sian OS records.

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

Supply Cloudflare credentials only through an authorized administrative environment, normally as `CLOUDFLARE_API_TOKEN`. Never add the value to this repository.

## Normal data-access workflow

At the beginning of a fitness session:

1. Fetch `/api/health`.
2. Fetch `/api/agent/context`.
3. Check `generatedAt`, recent dates, and whether today's check-in exists.
4. Base observations on recorded facts.
5. Ask for missing measurements or subjective information.

The Coach Agent stops at read/analysis and never writes records. When recording is requested, the Data Steward Agent continues:

6. Ask before destructive operations.
7. Write only confirmed information.
8. Re-read the affected endpoint after writing.
9. Summarize what changed and what remains uncertain.

```bash
export SIAN_OS_URL="https://sian-os.sianalimalik2418.workers.dev"
curl -sS "$SIAN_OS_URL/api/health"
curl -sS "$SIAN_OS_URL/api/agent/context"
```

Do not invent body weight, waist, food intake, sleep hours, symptoms, or subjective scores. Omit unknown optional fields rather than sending guesses or zeroes.

## Owner-initiated agent loop

Sian wants a simple, fast loop with no automatic pings:

1. Sian sends a natural-language daily log.
2. The Data Steward fetches relevant Lyfta workout details when a workout may exist for the logged date.
3. The Data Steward writes confirmed facts and reviewer-facing Lyfta workout notes to `POST /api/checkins`.
4. The Data Steward verifies the record with `GET /api/checkins?date=YYYY-MM-DD`.
5. Sian says `Analyze yesterday`.
6. The Coach gives the daily verdict from Sian OS records and Lyfta workout evidence when relevant.
7. If seven newer logged days exist since `last_weekly_report_date`, the Coach adds a weekly report with a nutrition-coach section and updates `/api/agent/state`.

The same public APIs support this flow. No scheduler or proactive message system is configured.

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
- sleep: numeric hours;
- weight: kilograms;
- waist: inches;
- water: liters;
- protein, fats, and carbs: grams;
- calories: estimated kcal;
- optional text: generally limited to 2,000 characters.

## Read endpoints

| Method | Path | Result |
| --- | --- | --- |
| `GET` | `/api/health` | Application health |
| `GET` | `/api/agent/context` | Preferred full coaching context |
| `GET` | `/api/agent/state?key=last_weekly_report_date` | Weekly-report cadence state |
| `GET` | `/api/dashboard` | Latest check-in, streak, week completion, and weight trend |
| `GET` | `/api/profile` | Owner profile and goals |
| `GET` | `/api/recipes` | Saved repeat recipes for nutrition lookup |
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

Today's check-in may be used as a running draft. The Home page and Data Steward may update `calories`, `protein_grams`, `fat_grams`, and `carb_grams` during the day through itemized foods, as long as existing fields are preserved on every direct check-in upsert.

Prefer itemized nutrition entries for foods. `POST /api/nutrition-entries` accepts one row with `date`, `item_name`, `calories`, and optional `protein_grams`, `fat_grams`, and `carb_grams`; the API automatically recalculates daily calorie/protein/fat/carb totals.

```json
{
  "date": "2026-08-01",
  "weight_kg": 72.4,
  "waist_inches": 31.5,
  "sleep_hours": 7.5,
  "water_liters": 2.5,
  "protein_grams": 145,
  "fat_grams": 70,
  "carb_grams": 300,
  "calories": 2400,
  "workout_text": "Lower session completed in Lyfta. Exercises: Smith squat 3x8 at controlled load; leg extension 2x12. Notes: no joint pain.",
  "notes": "Normal day"
}
```

Rules:

- `date` is required and unique;
- `weight_kg` is greater than 0 and at most 500;
- `waist_inches` is optional inches, greater than 0 and at most 200;
- `sleep_hours` is optional numeric hours from 0 to 24;
- `water_liters` is 0–30;
- `protein_grams` is an integer from 0–2000;
- `fat_grams` is an integer from 0–2000;
- `carb_grams` is an integer from 0–2000;
- `calories` is an optional integer from 0–20000;
- `nutrition_notes` is legacy optional text; do not use it for routine food logging;
- `workout_text` is optional free text for reviewer-facing workout notes derived from Lyfta; Lyfta remains the detailed workout source of truth;
- there are no readiness or mood fields;
- `DELETE /api/checkins?date=YYYY-MM-DD` permanently removes one check-in but keeps photos for that date.

### Profile

`PUT /api/profile` upserts profile fields. Read the existing profile first because omitted fields become `null`.

Supported fields: `height_cm`, `weight_kg`, `age`, `goals`, `experience_level`, `training_style`, `gym_schedule`, `equipment`, `injuries`, `long_term_vision`, `calorie_goal`, and `protein_goal`.

`calorie_goal` and `protein_goal` drive the Home progress cards and nutrition-coach comparisons. Defaults are 2200 kcal and 100 g protein when no profile value is set.

### Agent state

`PUT /api/agent/state` upserts limited agent-owned state. It currently accepts only:

```json
{ "key": "last_weekly_report_date", "value": "2026-08-10" }
```

Use `null` for `value` to clear it. Read this key before weekly analysis and update it after giving a weekly report so `Analyze yesterday` does not repeat the weekly summary until seven newer logged days exist.

### Recipes

Recipes are Sian OS's source for repeat-food nutrition values. The app exposes them in `/api/agent/context` as `savedRecipes`, and through `GET /api/recipes`.

Saved recipe fields include `name`, `aliases`, `category`, `serving_description`, `calories`, `protein_grams`, `fat_grams`, `carb_grams`, `ingredients`, `notes`, and photo metadata. Calories and macros represent one normal serving unless the serving description says otherwise.

When recording food from natural language, check saved recipes by name and aliases before estimating. If a logged item clearly matches a saved recipe, use its saved calories, protein, fats, and carbs. Estimate only unmatched foods or unclear amounts. If the serving or match is ambiguous, state the assumption or ask the owner instead of silently guessing.

### Reports

Reports are derived read-only views; they are not saved as separate records. `GET /api/reports` accepts optional `from` and `to` dates plus `interval=daily|weekly|monthly`. It returns summary averages and aggregated points for weight, waist, sleep, water, protein, fats, carbs, calories, and check-in coverage.

## Nutrition coaching contract

Nutrition coaching follows the canonical context and Sian's approved Peter Khatcherian-inspired principles:

- use phase-based nutrition rather than endless uncontrolled bulking and aggressive cutting;
- default to controlled lean gain unless Sian and the coach confirm a different phase;
- do not treat "eating clean" as sufficient without protein targets, calorie direction, body-weight trends, and performance review;
- avoid aggressive surpluses that mostly add body fat;
- make weekly adjustments from evidence, not emotions or one unusual day;
- prioritize nutrition, training execution, sleep, and hydration before supplements;
- build a repeatable framework that can be held, tightened, pushed, or pulled back over time.

Weekly nutrition analysis should use Sian OS reports/check-ins plus Lyfta performance evidence. Choose one practical decision:

- `Hold`;
- `Tighten`;
- `Increase slightly`;
- `Pull back slightly`;
- `Conditioning-first proposal`.

The decision must explain the evidence: body-weight trend, protein consistency, calorie direction when available, meal pattern quality, water, sleep, appetite/energy, and gym performance. Do not prescribe crash dieting, starvation, punishment cardio, or force-feeding.

### Progress photo

`POST /api/progress-photos` uses multipart form data with required `date` and `photo`, plus optional `label` and `notes`.

- Images only.
- Maximum 15 MB.
- `DELETE /api/progress-photos/:id` permanently deletes both the R2 object and D1 metadata.

### Export and backup

- `GET /api/export` downloads `sian-os-export`, version `8`.
- `POST /api/export` writes a timestamped JSON snapshot under `backups/` in R2.
- Exported progress-photo records do not include original image bytes.

## Data model

- `profile`: singleton owner profile where `id = 1`.
- `daily_checkins`: one row per date with weight, waist, sleep hours, water, derived nutrition totals, brief workout text, and general notes.
- `nutrition_entries`: itemized food rows by date with item name, calories, protein grams, fat grams, and carb grams. These rows drive the aggregate daily nutrition totals.
- `recipes`: saved repeat foods with calories, protein, fats, carbs, serving notes, ingredients, optional aliases, and private R2 photo object keys.
- `progress_photos`: D1 metadata and private R2 object key.
- `agent_state`: limited agent-owned state, currently the last weekly report date.
- `agent_audit_log`: API write history with action, entity type, entity ID, payload, and timestamp.

Reports are calculated from existing daily data rather than stored in a report table. Migration `0006_replace_weekly_reviews_with_reports.sql` removes the retired weekly-review table. Migration `0007_profile_checkin_nutrition_remove_progress.sql` moves legacy meal notes into check-ins and removes the retired body-measurement and separate nutrition tables. Both were applied to production on 2026-07-30 after backup and owner approval. Migration `0009_recipes.sql` adds the recipe library. Migration `0010_checkin_fats_carbs.sql` adds optional fats and carbs to daily check-ins. Migration `0011_checkin_waist_inches.sql` adds optional waist measurements in inches. Migration `0012_profile_nutrition_goals.sql` adds editable calorie and protein goals to the profile. Migration `0013_nutrition_entries.sql` adds itemized food rows. Migration `0014_nutrition_entry_macros.sql` adds fats and carbs to itemized nutrition entries so rows recalculate daily calorie/protein/fat/carb totals. Migration `0015_recipe_macros.sql` adds saved recipe fats and carbs so recipe logging can populate daily macro rows.

## Calculated metrics

- Daily streak uses consecutive UTC dates and may anchor on yesterday when today is incomplete.
- Weeks start Monday in UTC.
- Sleep is stored as directly logged numeric hours.
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

The canonical push/deployment procedure is [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md). It covers Git synchronization, checks, backups, migrations, deployment, verification, and failure recovery.

**Run checks and build:**

```bash
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

**Commit and push:**

```bash
git add -A
git commit -m "Describe the change"
git push origin main
```

**After backing up, apply any new approved migration and deploy:**

```bash
npm run db:remote
npm run deploy
```

Skip the migration command when none is pending. Always build after the final code change because Wrangler deploys the existing `dist/` output.

## Product invariants

1. The app and APIs remain public with no authentication.
2. Check-in remains a global dialog; `/check-in` does not exist.
3. The experience remains mobile-first.
4. Use Coss UI and the shared Date Picker instead of native date inputs.
5. Mood and readiness do not belong in the UI, API, types, or database.
6. Sleep is logged as numeric hours instead of separate sleep and wake times.
7. Structured workout tracking, body-measurement tracking, separate nutrition logs, and weekly-review journaling do not belong in the product.
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
