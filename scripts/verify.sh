#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

run_step() {
  local step_name="$1"
  shift

  echo
  echo "==> $step_name"

  if ! "$@"; then
    echo
    echo "Verification failed during: $step_name" >&2
    return 1
  fi
}

run_step "TypeScript build" npm run tsc
run_step "Lint" npm run lint
run_step "Tests" npm test -- --run
run_step "Production build" npm run build

echo
echo "Verification passed."
