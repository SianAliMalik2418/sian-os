# Sian OS Implementation Plan

Sian OS is a public, single-user wellness operating system built with TanStack Start on Cloudflare Workers, D1, and R2. It focuses on daily consistency, recovery, nutrition, derived wellness reports, and external AI-agent coaching. The web app and API intentionally require no authentication.

Workout tracking is explicitly outside the product scope.

## Current baseline

- Cloudflare Worker: `sian-os`
- URL: `https://sian-os.sianalimalik2418.workers.dev`
- D1 database: `sian-os-db`
- R2 bucket: `sian-os-files`
- Public web application and API
- Mobile-first Coss UI
- Global daily check-in dialog with nutrition and progress photos
- Editable owner profile
- Daily, weekly, and monthly reports with Dither Kit charts
- External coach-agent context and writes
- Versioned JSON export and R2 backups

## Daily wellness flow

Goal: make the app useful every day in under two minutes.

- Check in from any page using the global dialog.
- Record weight, sleep/wake times, water, protein, meal notes, general notes, and progress photos.
- Calculate sleep duration server-side.
- Upsert by date so today's check-in can be edited.
- Show streak and weekly completion indicators with checkmarks.
- Keep mood and readiness out of the product.

## Check-in details

Goal: keep daily wellness data in one fast workflow.

- Capture nutrition in a templated Breakfast/Lunch/Dinner textarea.
- Upload progress photos to R2 from the check-in dialog.
- Keep protein and water as reportable numeric signals.
- Edit or delete daily check-ins from daily reports.
- Keep body-measurement and separate nutrition-log systems out of the product.

## Reports

Goal: turn logs into clear visual trends.

- Show daily, weekly, and monthly reporting intervals.
- Add preset and custom date ranges.
- Chart weight, sleep, hydration, and protein with Dither Kit.
- Show summary averages and detailed reporting tables.
- Expose bounded report data through `/api/reports`.

## External coach interface

Goal: support structured coaching without embedding AI in the app.

- Maintain documented profile, dashboard, check-in, photo, and report endpoints.
- Keep bounded query modes instead of arbitrary SQL.
- Audit API writes.
- Require confirmation for destructive actions.
- Treat the system as wellness tracking, not medical diagnosis.

## Product polish

- Keep the app mobile-first and keyboard-friendly.
- Use Coss components throughout.
- Use the shared Date Picker instead of native date inputs.
- Add polished loading, error, and empty states.
- Keep navigation focused on Today, Check-in, Reports, and Profile.

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
