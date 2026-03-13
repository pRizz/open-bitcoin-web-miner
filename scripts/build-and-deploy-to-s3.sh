#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/remote-reporting.sh
source "$SCRIPT_DIR/lib/remote-reporting.sh"
setup_remote_report "build-and-deploy-to-s3"

if [[ ! -f .env.sentry-build-plugin ]]; then
  echo "Error: .env.sentry-build-plugin not found. Create it with SENTRY_AUTH_TOKEN for the Sentry Vite plugin."
  exit 1
fi

echo "Loading Sentry build environment from .env.sentry-build-plugin"
set -a
source .env.sentry-build-plugin
set +a

echo "Running pnpm build-and-deploy"
pnpm build-and-deploy
