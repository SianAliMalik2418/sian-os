# Sian OS Implementation Plan

Sian OS is a private Personal Fitness OS built with TanStack Start on Cloudflare Workers, D1, and R2. The app is not SaaS; it is a single-user operating system for long-term training, recovery, nutrition, body progress, and external AI-agent coaching.

## Current Baseline

Live app:

- Cloudflare Worker: `sian-os`
- URL: `https://sian-os.sianalimalik2418.workers.dev`
- D1 database: `sian-os-db`
- R2 bucket: `sian-os-files`

Implemented:

- TanStack Start app foundation
- Cloudflare Worker deployment
- D1 schema migration
- R2 bucket binding
- Simple password login route
- Agent bearer-token auth path
- Core API endpoints:
  - `GET /api/health`
  - `GET /api/dashboard`
  - `GET /api/agent/context`
  - `GET/POST /api/checkins`
  - `GET/POST /api/workouts`
- Coss UI component source installed

## Phase 1 — Foundation Hardening

Goal: make the existing foundation safe, understandable, and reliable before adding more product surface.

Tasks:

- Add protected app layout and route guards.
- Redirect unauthenticated UI visits to `/login`.
- Keep API auth enforced inside every handler touching private data.
- Add logout button and session status endpoint.
- Add `README.md` setup docs for local dev, deploy, D1 migrations, secrets, and agent token usage.
- Add API contract docs for external coaching agents.
- Remove or mark smoke-test seed data clearly.
- Add consistent API error responses.
- Add local dev instructions for `.dev.vars` without committing secrets.

Acceptance criteria:

- Private pages cannot be viewed without login.
- Agent endpoints work with bearer token and reject missing/invalid tokens.
- A future agent can read docs and know how to query/write fitness data.
- `npm run typecheck`, `npm run build`, and `npm audit --audit-level=high` pass.

## Phase 2 — Daily OS MVP

Goal: make the app useful every day in under two minutes.

Tasks:

- Wire dashboard cards to live D1 data.
- Build daily check-in form:
  - weight
  - sleep duration
  - sleep quality
  - water intake
  - protein estimate
  - energy
  - motivation
  - recovery
  - mood
  - soreness
  - stress
  - notes
- Add today/edit-existing behavior using `date` uniqueness.
- Add streak calculation.
- Add weekly completion indicators.
- Add Coss-based empty states, cards, buttons, inputs, badges, progress indicators.

Acceptance criteria:

- User can log today’s check-in from the UI.
- Dashboard immediately reflects latest check-in.
- Agent context includes recent check-ins.
- Daily flow takes less than two minutes.

## Phase 3 — Workout Tracking MVP

Goal: replace basic API-only workout logging with a usable private training log.

Tasks:

- Add exercise library UI.
- Add workout creation flow.
- Add set logging:
  - exercise
  - set number
  - reps
  - weight
  - RPE/RIR
  - rest time
  - notes
- Show previous performance while logging a set.
- Add recent workouts list.
- Add workout detail page.
- Add edit/delete flows with confirmation.

Acceptance criteria:

- User can log a full workout in the app.
- Exercise names are reused instead of duplicated.
- Workout history is permanently stored in D1.
- Agent API can read recent workouts and sets.

## Phase 4 — Exercise History + Progressive Overload

Goal: make the system answer “am I getting stronger?” per exercise.

Tasks:

- Add exercise detail pages.
- Show full exercise history.
- Add personal record detection:
  - max weight
  - max reps at weight
  - estimated 1RM
  - best volume set
- Add simple progress graphs.
- Add training frequency.
- Add stalled exercise detection.
- Add progressive overload suggestions:
  - increase reps first
  - increase weight when top of rep range is reached
  - maintain load when RPE/recovery says not ready

Acceptance criteria:

- User can open an exercise and know what they lifted last time.
- The app clearly shows PRs and trends.
- The app can flag stalled lifts.

## Phase 5 — Body Progress, Nutrition, and Recovery

Goal: connect physical progress and lifestyle inputs to performance.

Tasks:

- Add body measurement logging UI.
- Add body trend pages:
  - weight
  - weekly averages
  - monthly trends
  - measurements
- Add R2 progress photo upload.
- Store progress photo metadata in D1.
- Add nutrition UI:
  - meals
  - protein estimate
  - water
  - supplements
  - consistency
- Add recovery UI:
  - sleep
  - energy
  - soreness
  - stress
  - recovery score
- Add dashboard correlations between recovery and workout performance.

Acceptance criteria:

- Progress photos upload to R2 and metadata persists in D1.
- Trends emphasize weekly/monthly patterns over daily noise.
- Recovery and nutrition data appear in agent context.

## Phase 6 — Weekly Review System

Goal: turn logs into decision-making and weekly reflection.

Tasks:

- Add weekly review page.
- Auto-compute weekly stats:
  - workouts completed
  - missed workouts
  - strength improvements
  - body weight change
  - nutrition consistency
  - water consistency
  - recovery quality
  - best workout
  - weak area
- Add editable subjective fields:
  - wins
  - lessons learned
  - focus next week
- Add endpoint to generate/rebuild weekly review data from D1.
- Add agent endpoint focused on weekly review context.

Acceptance criteria:

- User can review a week from one page.
- Review is saved permanently.
- External coach agent can retrieve weekly review data cleanly.

## Phase 7 — External Coaching Agent Interface

Goal: make the app easy for an outside AI agent to query and write without in-app AI.

Tasks:

- Add documented read endpoints:
  - profile
  - dashboard
  - recent check-ins
  - recent workouts
  - exercise history
  - weekly reviews
  - body progress
- Add documented write endpoints:
  - check-in
  - workout
  - body measurement
  - nutrition log
  - recovery note
  - weekly review fields
- Add query endpoint with explicit modes, not arbitrary SQL.
- Add examples using `curl`.
- Add read-only summary endpoints for safer agent access.
- Add audit log table for agent writes.

Acceptance criteria:

- External agent can answer coaching questions from structured data.
- External agent can write approved logs/notes using the bearer token.
- No arbitrary SQL is exposed.

## Phase 8 — Premium Product Polish

Goal: make the app feel like a calm, premium personal operating system.

Tasks:

- Replace rough dashboard elements with Coss components throughout.
- Add responsive sidebar/navigation.
- Add loading and empty states.
- Add keyboard-friendly forms.
- Add mobile-first check-in flow.
- Add visual hierarchy for today/this week/long-term.
- Add deployment polish:
  - production metadata
  - preview URL settings
  - documented secret rotation
  - optional custom domain later

Acceptance criteria:

- App feels clean, fast, modern, calm, and motivating.
- Every page answers: “What should I do next to become stronger, healthier, and more consistent?”

## Phase 9 — Long-Term Reliability

Goal: preserve years of history safely.

Tasks:

- Add export endpoint for all personal data.
- Add R2 backup snapshots for JSON exports.
- Add migration discipline and rollback notes.
- Add data integrity checks.
- Add import path for backups.
- Add tests for core calculations.

Acceptance criteria:

- Nothing important is trapped or easily lost.
- User can export and back up all history.
- Schema changes are tracked and reversible where practical.

## Development Rules

- Use official tooling where possible.
- If official tooling/generators fail or become interactive, stop and explain before using a fallback.
- Add packages with install commands, not manual `package.json` edits.
- Keep backend inside TanStack Start API/server routes, not a standalone backend.
- Keep Cloudflare as the deployment/storage ecosystem.
- Run checks before committing:
  - `npm run typecheck`
  - `npm run build`
  - `npm audit --audit-level=high`
