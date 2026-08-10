# Sian OS

Public personal wellness operating system built with TanStack Start, Cloudflare Workers, D1, and R2.

## Access model

Sian OS intentionally has **no authentication**. The web application and every API endpoint are publicly accessible, including read, write, delete, export, backup, and progress-photo routes. Deploy only when that exposure is intended.

## Local development

Requirements: Node.js 22+, npm, and a Cloudflare account for deployment.

```bash
npm ci
npm run db:local
npm run dev
```

No environment secrets or `.dev.vars` file are required. There is no committed seed or smoke-test data; a new database starts empty. Local D1 and R2 data is managed by Wrangler under `.wrangler/`.

## Cloudflare bindings

- `DB`: D1 binding configured in `wrangler.jsonc`.
- `FILES`: R2 binding configured in `wrangler.jsonc`.

## Database migrations

Apply locally before developing:

```bash
npm run db:local
```

Apply to production before deploying code that needs a new schema:

```bash
npm run db:remote
```

Migrations are append-only files in `migrations/`. Do not modify an applied migration. Add the next numbered migration and document destructive/manual rollback steps. D1 migrations are forward-oriented; take a JSON/R2 backup from **Export all data** before risky schema changes.

## Push and deployment

Follow the complete [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) runbook for backups, migrations, pushing, deployment, verification, and failure handling.

**Run checks and build:**

```bash
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

**Commit and push `main`:**

```bash
git add -A
git commit -m "Describe the change"
git push origin main
```

**Apply new approved production migrations, then deploy:**

```bash
npm run db:remote
npm run deploy
```

Skip `npm run db:remote` when no new migration exists. The production Worker is `sian-os`; record its version ID and smoke-test production after deployment.

## Backups and exports

- `GET /api/export` publicly downloads a complete JSON export.
- `POST /api/export` writes a timestamped JSON snapshot under `backups/` in R2.
- Progress-photo metadata is included in exports. Original images are publicly retrievable through the application endpoint.

The JSON format is versioned (`sian-os-export`, version `5`) so a future importer can validate it before writing.

## External coaching agents

- [`docs/FITNESS_COACHING_CONTEXT.md`](docs/FITNESS_COACHING_CONTEXT.md) — canonical living record of personal coaching context and confirmed decisions.
- [`docs/agents/COACH_AGENT.md`](docs/agents/COACH_AGENT.md) — daily judgment, guidance, accountability, and progress-analysis role.
- [`docs/agents/DATA_STEWARD_AGENT.md`](docs/agents/DATA_STEWARD_AGENT.md) — confirmed-data recording and verification role.
- [`docs/COACH_AGENT_HANDOFF.md`](docs/COACH_AGENT_HANDOFF.md) — complete coach and Cloudflare operations handoff.
- [`docs/AGENT_API.md`](docs/AGENT_API.md) — concise API reference.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Git push and Cloudflare deployment runbook.

Agents call the public API without credentials. Writes are recorded in `agent_audit_log`; no arbitrary SQL endpoint exists.

Current agent check-ins support estimated `calories`, formatted `nutrition_notes`, and brief `workout_text`. Detailed workout history remains in Hevy.
