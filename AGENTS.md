# Repository Agent Instructions

## Canonical files

Use the smallest current doc set:

- `AGENTS.md`: repo, API, data-safety, migration, and deployment rules for coding agents.
- `docs/FITNESS_COACHING_CONTEXT.md`: durable coaching decisions, goals, source-of-truth boundaries, and decision log.
- `docs/SIAN_HEALTH_COACH_GPT_INSTRUCTIONS.md`: paste into the Custom GPT Instructions field.
- `docs/SIAN_HEALTH_COACH_KNOWLEDGE.md`: upload as the Custom GPT knowledge file.
- `docs/sian-os-health-api.openapi.yaml`: paste into the Custom GPT Action schema.

Do not recreate separate handoff, role, API, or deployment docs unless the owner explicitly asks. Put technical operating details here. Put coaching decisions in `docs/FITNESS_COACHING_CONTEXT.md`. Put only Custom GPT runtime material in the three GPT files above.

## Stack and production

- GitHub repository: `https://github.com/SianAliMalik2418/sian-os`
- Branch: `main`
- Production Worker: `sian-os`
- Production URL: `https://sian-os.sianalimalik2418.workers.dev`
- Cloudflare account ID: `5b09b3f3dac5e3e6ca0e40cc37eed282`
- D1 binding/database: `DB` / `sian-os-db`
- D1 database ID: `c96ee3c8-9aab-4b6f-8620-771cc3dbd63a`
- R2 binding/bucket: `FILES` / `sian-os-files`
- Runtime: Cloudflare Workers with `nodejs_compat`
- App stack: React, TanStack Start/Router, TypeScript, Vite, D1, R2, Zod, Vitest, Coss UI, Dither Kit

The app and API are intentionally public. Never commit or print Cloudflare tokens, GitHub credentials, Lyfta keys, `.dev.vars`, session cookies, database backups, or private credentials. Treat body, food, and progress-photo data as sensitive even though the current API has no auth.

## Source of truth boundaries

Before fitness coaching, coaching-related product changes, wellness interpretation, or owner data writes:

1. Read `docs/FITNESS_COACHING_CONTEXT.md`.
2. Use Sian OS as the wellness source of truth.
3. Use Sian OS Lyfta-backed endpoints to read detailed workout records unless the owner explicitly changes that decision.

Lyfta remains the upstream workout tracker, but Sian OS now proxies read-only Lyfta workout data through `/api/lyfta/workouts`. GPTs and agents should call Sian OS, not Lyfta directly. Sian OS may store reviewer-facing Lyfta summaries in the daily check-in `workout_text` field.

Sian OS owns check-ins, sleep hours, body weight, waist, water, itemized nutrition entries, derived daily macro totals, profile goals, saved recipes, saved recipe bundles, reports, agent state, and progress photos.

## Fitness role routing

Fitness operations use two separated roles selected by user intent.

### Coach

Use Coach behavior when the owner asks for guidance, accountability, progress review, trend analysis, workout interpretation, nutrition analysis, plan adjustment, or says `Analyze yesterday`.

Coach rules:

- read Sian OS records and Lyfta evidence;
- do not inspect or modify source code during a fitness operation;
- do not write, edit, or delete operational Sian OS records;
- give one evidence-based verdict and one next action;
- update `docs/FITNESS_COACHING_CONTEXT.md` only after a new coaching decision is explicitly confirmed.

### Data Steward

Use Data Steward behavior when the owner asks to record, log, save, correct, update, or delete wellness data.

Data Steward rules:

- read current records first;
- write only owner-confirmed facts through validated APIs;
- verify the stored result by reading it back;
- do not coach, judge, or change the plan;
- require explicit approval before destructive actions.

When one message includes both confirmed daily facts and asks for coaching, record and verify first, then coach from the fresh records. Keep the record confirmation and coaching verdict separate.

Neither role debugs the app. Route code bugs, deployments, schema changes, UI work, and API changes to normal development work.

## Current API contract

Base URL:

```bash
export SIAN_OS_URL="https://sian-os.sianalimalik2418.workers.dev"
```

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

Units and formats:

- dates: `YYYY-MM-DD`;
- sleep: numeric hours;
- weight: kilograms;
- waist: inches;
- water: liters;
- protein, fats, and carbs: grams;
- calories: estimated kcal.

Omit unknown optional fields. Never send zero as a placeholder.

Read endpoints:

- `GET /api/health`
- `GET /api/agent/context`
- `GET /api/agent/query?mode=dashboard`
- `GET /api/agent/state?key=last_weekly_report_date`
- `GET /api/dashboard`
- `GET /api/profile`
- `GET /api/checkins?date=YYYY-MM-DD`
- `GET /api/checkins?limit=30`
- `GET /api/nutrition-entries?date=YYYY-MM-DD`
- `GET /api/recipes`
- `GET /api/recipe-bundles`
- `GET /api/lyfta/workouts?limit=20&page=1`
- `GET /api/reports?interval=daily|weekly|monthly&from=YYYY-MM-DD&to=YYYY-MM-DD`

Write endpoints:

- `POST /api/checkins`: upsert one daily check-in by date. Read the existing row first because omitted optional fields are cleared.
- `POST /api/nutrition-entries`: add one itemized food row and recalculate daily calorie/protein/fat/carb totals.
- `DELETE /api/nutrition-entries/{entryId}`: delete one food row and recalculate totals.
- `PUT /api/profile`: upsert profile and nutrition goals. Read first because omitted fields become null.
- `POST /api/recipes`, `PUT /api/recipes/{recipeId}`, `DELETE /api/recipes/{recipeId}`: manage one-serving saved recipes.
- `POST /api/recipe-bundles`, `PUT /api/recipe-bundles/{bundleId}`, `DELETE /api/recipe-bundles/{bundleId}`: manage saved meal templates.
- `PUT /api/agent/state`: update only `last_weekly_report_date` after giving a weekly report.
- `POST /api/export`: create a production backup.

Routine food logging must use `/api/nutrition-entries`, not `nutrition_notes`. Each entry needs `date`, `item_name`, and `calories`, with optional `protein_grams`, `fat_grams`, and `carb_grams`.

Saved recipes represent one normal serving. Match foods by name and aliases before estimating. For multiple servings, multiply macros exactly and keep decimals. Label rows with the count, such as `Bread x3` or `Egg x1.5`.

Saved recipe bundles are quick templates. When logging a bundle, expand it into its included saved recipes, then apply the owner's one-day changes before writing entries. One-day changes may change recipe quantities, remove bundled recipes, or add other recipes. Do not edit the saved bundle unless the owner explicitly asks to change the recurring template.

## Agent loop

Daily logging:

1. `GET /api/health`
2. `GET /api/agent/context`
3. Resolve the date.
4. Read existing check-in and food rows for that date.
5. Check saved recipes and recipe bundles before estimating food.
6. Fetch workout details through `/api/lyfta/workouts` when a workout may exist.
7. Write confirmed non-food facts to `/api/checkins`.
8. Write food items to `/api/nutrition-entries`.
9. Re-read the affected date and report what was written, preserved, unknown, and verified.

Daily analysis:

1. `GET /api/health`
2. `GET /api/agent/context`
3. `GET /api/checkins?limit=30`
4. Use the latest completed/logged day unless the owner specifies another date.
5. Read Lyfta-backed Sian OS evidence when workout details matter.
6. Give exactly one verdict: `On Track`, `Needs Correction`, `Off Plan`, or `Insufficient Data`.

Weekly analysis runs only after seven newer logged days exist since `last_weekly_report_date`. After giving the weekly report, write the latest covered date to `/api/agent/state`.

## Coaching document maintenance

When the owner and coach confirm a new or changed goal, rule, target, schedule, exception, training plan, nutrition approach, reporting format, platform choice, source of truth, or workflow:

1. Update the active section of `docs/FITNESS_COACHING_CONTEXT.md` in the same work session.
2. Add a dated decision-log entry.
3. Remove or clearly mark superseded active guidance.
4. Record only confirmed decisions. Keep proposals and open questions labeled.

Do not put daily operational data in the coaching context when it belongs in Sian OS or Lyfta.

## Product invariants

- Check-in remains a global dialog; `/check-in` does not exist.
- The app remains mobile-first but must work cleanly on laptop and desktop.
- Use Coss UI and shared app components where they already exist.
- Mood and readiness do not belong in the UI, API, types, or database.
- Sleep is logged as numeric hours, not separate sleep/wake fields.
- Do not rebuild Sian OS as a competing workout tracker.
- Reports are derived from source records.
- API inputs stay strict and validated.
- There is no arbitrary public SQL endpoint.
- Migrations are append-only.
- Back up before risky production changes.
- Never fabricate or silently overwrite personal data.

## Development and deployment

Normal local command:

```bash
npm run dev
```

Before committing application changes, run the relevant checks. For broad changes, run:

```bash
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

Migration rules:

1. Never edit a migration already applied remotely.
2. Add the next zero-padded migration under `migrations/`.
3. Apply locally with `npm run db:local`.
4. Test against the migrated local schema.
5. Back up production before risky or destructive changes.
6. Show destructive SQL and ask for owner approval.
7. Apply production migrations with `npm run db:remote`.
8. Deploy compatible code immediately after dependent migrations.
9. Verify migration history, schema, routes, and representative reads.

Deployment rules:

1. Work from `main`.
2. Check `git status --short`, `git fetch origin main`, local `HEAD`, and `origin/main`.
3. Never force-push.
4. Build after the final source change because Wrangler deploys the existing `dist/` output.
5. Commit only intended files.
6. Push to `origin main`.
7. Deploy with `npm run deploy`.
8. Smoke-test `/`, `/profile`, `/reports`, `/api/health`, `/api/agent/context`, and the changed endpoints.

Skip deployment for docs-only changes unless the owner asks for it.
