# Sian OS

Public personal fitness operating system built with TanStack Start, Cloudflare Workers, D1, and R2.

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

## Checks and deployment

```bash
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
npm run deploy
```

The production Worker is configured as `sian-os`. Confirm migrations before deployment.

## Backups and exports

- `GET /api/export` publicly downloads a complete JSON export.
- `POST /api/export` writes a timestamped JSON snapshot under `backups/` in R2.
- Progress-photo metadata is included in exports. Original images are publicly retrievable through the application endpoint.

The JSON format is versioned (`sian-os-export`, version `1`) so a future importer can validate it before writing.

## External coaching agents

- [`docs/COACH_AGENT_HANDOFF.md`](docs/COACH_AGENT_HANDOFF.md) — complete coach and Cloudflare operations handoff.
- [`docs/AGENT_API.md`](docs/AGENT_API.md) — concise API reference.

Agents call the public API without credentials. Writes are recorded in `agent_audit_log`; no arbitrary SQL endpoint exists.
