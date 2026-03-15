#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/remote-reporting.sh
source "$SCRIPT_DIR/lib/remote-reporting.sh"
setup_remote_report "build-and-deploy-to-s3"

if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  if [[ ! -f .env.sentry-build-plugin ]]; then
    echo "Error: SENTRY_AUTH_TOKEN is not set and .env.sentry-build-plugin was not found."
    echo "Create .env.sentry-build-plugin with SENTRY_AUTH_TOKEN or export SENTRY_AUTH_TOKEN before running this script."
    exit 1
  fi

  echo "Loading Sentry build environment from .env.sentry-build-plugin"
  set -a
  source .env.sentry-build-plugin
  set +a
else
  echo "Using SENTRY_AUTH_TOKEN from the current environment"
fi

echo "Running npm run build-and-deploy"
npm run build-and-deploy
