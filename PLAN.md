# Sian OS Implementation Plan

Sian OS is a public, single-user wellness operating system built with TanStack Start on Cloudflare Workers, D1, and R2. It focuses on daily consistency, recovery, nutrition, body progress, weekly reflection, and external AI-agent coaching. The web app and API intentionally require no authentication.

Workout tracking is explicitly outside the product scope.

## Current baseline

- Cloudflare Worker: `sian-os`
- URL: `https://sian-os.sianalimalik2418.workers.dev`
- D1 database: `sian-os-db`
- R2 bucket: `sian-os-files`
- Public web application and API
- Mobile-first Coss UI
- Global daily check-in dialog
- Body measurements, nutrition logs, and progress photos
- Weekly reflection system
- External coach-agent context and writes
- Versioned JSON export and R2 backups

## Daily wellness flow

Goal: make the app useful every day in under two minutes.

- Check in from any page using the global dialog.
- Record weight, sleep/wake times, water, protein, and notes.
- Calculate sleep duration server-side.
- Upsert by date so today's check-in can be edited.
- Show streak and weekly completion indicators with checkmarks.
- Keep mood and readiness out of the product.

## Body progress and nutrition

Goal: emphasize sustainable trends over daily noise.

- Record body weight and circumference measurements.
- Record nutrition summaries, protein, water, supplements, and consistency.
- Upload progress photos to R2 with metadata in D1.
- Improve weekly and monthly trend visualization.
- Add safe correction/delete flows for append-only records.

## Weekly reflection

Goal: turn logs into clear decisions.

- Compute body-weight change, nutrition consistency, and water consistency.
- Capture wins, lessons, and next-week focus.
- Save permanent weekly snapshots.
- Keep weekly review context available to the external coach.

## External coach interface

Goal: support structured coaching without embedding AI in the app.

- Maintain documented profile, dashboard, check-in, body, nutrition, and weekly-review endpoints.
- Keep bounded query modes instead of arbitrary SQL.
- Audit API writes.
- Require confirmation for destructive actions.
- Treat the system as wellness tracking, not medical diagnosis.

## Product polish

- Keep the app mobile-first and keyboard-friendly.
- Use Coss components throughout.
- Use the shared Date Picker instead of native date inputs.
- Add polished loading, error, and empty states.
- Keep navigation focused on Today, Check-in, Progress, and Weekly Review.

## Long-term reliability

- Keep migrations append-only.
- Back up before risky schema changes.
- Preserve export format versioning.
- Add an import/restore path.
- Add integrity checks and broader endpoint tests.
- Keep Cloudflare Workers, D1, and R2 as the deployment/storage platform.

## Development rules

- Use official tooling where possible.
- If official tooling fails or becomes interactive, stop and explain before using a fallback.
- Add packages with install commands, not manual `package.json` edits.
- Keep backend code inside TanStack Start API/server routes.
- Run before committing:
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `npm audit --audit-level=high`
