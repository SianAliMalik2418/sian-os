# Push and Deployment Runbook

Use this runbook to publish Sian OS to GitHub and Cloudflare Workers.

## Production resources

- Git branch: `main`
- Git remote: `origin`
- Worker: `sian-os`
- URL: `https://sian-os.sianalimalik2418.workers.dev`
- D1 database: `sian-os-db`
- R2 bucket: `sian-os-files`

The application and APIs are intentionally public. Never commit Cloudflare tokens, GitHub credentials, backups, or `.dev.vars` files.

## 1. Prepare the branch

**Check the branch and working tree:**

```bash
git branch --show-current
git status --short
git fetch origin main
git rev-parse HEAD
git rev-parse origin/main
```

Start from `main`, inspect every changed file, and confirm that local `main` has not fallen behind `origin/main`. Never force-push this repository. If the remote changed, review and integrate those changes before continuing.

## 2. Apply migrations locally and run all checks

When a new migration exists, apply it to local D1 and test against the resulting schema.

**Apply local migrations:**

```bash
npm run db:local
```

Review the SQL under `migrations/`, especially `DROP TABLE`, `DROP COLUMN`, `DELETE`, and data-rewrite statements. Skip the migration command when no new migration exists.

**Validate and build the exact code that will be deployed:**

```bash
npm ci
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

`npm run deploy` uploads the existing `dist/` output, so `npm run build` must succeed after the final source change and before deployment.

## 3. Commit and push

Use a focused commit message describing the product change.

**Stage and inspect:**

```bash
git add -A
git status --short
git diff --cached --check
git diff --cached --stat
```

**Commit and push:**

```bash
git commit -m "Describe the change"
git push origin main
```

Do not deploy uncommitted application code. After pushing, verify that local and remote `main` match.

**Verify Git state:**

```bash
git status --short
git rev-parse HEAD
git rev-parse origin/main
```

The status output should be empty and both hashes should match.

## 4. Handle database migrations

Skip this section when no new migration exists.

Migrations are append-only. Never edit a migration already applied to production. Destructive production migrations require explicit owner approval and a backup immediately beforehand.

**Create an R2 JSON backup through the production API:**

```bash
curl -fsS -X POST \
  "https://sian-os.sianalimalik2418.workers.dev/api/export"
```

**Download a second copy into the ignored `backups/` directory:**

```bash
mkdir -p backups
curl -fsS \
  "https://sian-os.sianalimalik2418.workers.dev/api/export" \
  --output "backups/pre-deploy-$(date -u +%Y-%m-%dT%H-%M-%SZ).json"
```

Confirm that both backups succeeded before applying destructive SQL. If the public backup endpoint is unavailable, stop and explain the failure before using a Cloudflare D1 API/export fallback.

**Apply approved production migrations:**

```bash
npm run db:remote
```

Read the migration table in Wrangler's output and ensure every expected migration is marked successful. If a migration request fails or returns an uncertain result, inspect remote migration history and schema before retrying.

When a migration and its code are mutually dependent, continue directly to deployment to minimize the compatibility window.

## 5. Deploy the Worker

**Deploy the previously built output:**

```bash
npm run deploy
```

Record the `Current Version ID` printed by Wrangler. A successful command must report the production URL and a version ID.

## 6. Verify production

Allow a short propagation window, then verify current and intentionally removed routes.

**Smoke-test current routes:**

```bash
base="https://sian-os.sianalimalik2418.workers.dev"
curl -fsS -o /dev/null -w "/ %{http_code}\n" "$base/"
curl -fsS -o /dev/null -w "/profile %{http_code}\n" "$base/profile"
curl -fsS -o /dev/null -w "/reports %{http_code}\n" "$base/reports"
curl -fsS -o /dev/null -w "/api/health %{http_code}\n" "$base/api/health"
curl -fsS -o /dev/null -w "/api/reports %{http_code}\n" "$base/api/reports"
curl -fsS -o /dev/null -w "/api/agent/context %{http_code}\n" "$base/api/agent/context"
curl -fsS -o /dev/null -w "/api/agent/state %{http_code}\n" "$base/api/agent/state?key=last_weekly_report_date"
```

Current routes should return `200`.

**Check retired routes:**

```bash
base="https://sian-os.sianalimalik2418.workers.dev"
curl -sS -o /dev/null -w "/progress %{http_code}\n" "$base/progress"
curl -sS -o /dev/null -w "/weekly-review %{http_code}\n" "$base/weekly-review"
curl -sS -o /dev/null -w "/api/body-measurements %{http_code}\n" "$base/api/body-measurements"
curl -sS -o /dev/null -w "/api/nutrition %{http_code}\n" "$base/api/nutrition"
curl -sS -o /dev/null -w "/api/weekly-reviews %{http_code}\n" "$base/api/weekly-reviews"
```

Retired routes should return `404`. Also verify migration history and the relevant D1 tables/columns after schema changes.

## Failure handling

- **`git push` is rejected:** fetch and inspect the remote changes. Never force-push.
- **Wrangler reports `fetch failed`:** no successful deployment is implied. Check connectivity and retry the same official command; do not silently switch to a manual deployment method.
- **A command becomes interactive:** stop and let the owner answer, or ask before continuing. Do not bypass the prompt manually.
- **Migration status is uncertain:** inspect `d1_migrations` and the live schema before retrying.
- **Temporary `404` or `500` after deployment:** check the active Worker version and retry read-only smoke tests during propagation. Do not write test data.
- **Application rollback is needed:** select a known-good Worker version through official Cloudflare tooling. Database migrations are forward-oriented; restore or repair data only from an approved backup and with explicit owner approval.

## Completion record

A deployment report should include:

- pushed Git commit hash;
- Worker version ID;
- applied migration names, if any;
- backup key/path for destructive changes;
- check, build, and audit results;
- representative production route statuses;
- confirmation that local and remote `main` match and the working tree is clean.
