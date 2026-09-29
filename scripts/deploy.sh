#!/usr/bin/env bash
# Deploys the built Worker non-interactively on any machine, using whatever
# CLOUDFLARE_API_TOKEN is already in the environment (shell export, CI secret,
# or a local untracked .env file). Wrangler reads this var itself; this script
# just fails fast with a clear message instead of hanging on an OAuth prompt
# when the token is missing.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "CLOUDFLARE_API_TOKEN is not set." >&2
  echo "Export it in your shell/CI, or add it to a local .env file (gitignored, never committed)." >&2
  exit 1
fi

exec wrangler deploy
