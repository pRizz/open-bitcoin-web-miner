#!/usr/bin/env bash
set -euo pipefail

expected_production_branch="${EXPECTED_PRODUCTION_BRANCH:-main}"
deploy_host="${DEPLOY_HOST:-win3bitco.in}"
ref_name="${GITHUB_REF_NAME:-}"
event_name="${GITHUB_EVENT_NAME:-}"

if [[ "$event_name" == "workflow_dispatch" && "$ref_name" != "$expected_production_branch" ]]; then
  echo "Manual production deploys must target ${expected_production_branch}. Received ref '${ref_name:-unknown}'." >&2
  exit 1
fi

if [[ "$ref_name" != "$expected_production_branch" ]]; then
  echo "Production deploys must run from ${expected_production_branch}. Received ref '${ref_name:-unknown}'." >&2
  exit 1
fi

head_sha="$(git rev-parse HEAD)"
head_short_sha="$(git rev-parse --short=7 HEAD)"
commit_date="$(git show -s --format=%cI HEAD)"

echo "Validated production deploy inputs:"
echo "- Event: ${event_name}"
echo "- Branch: ${ref_name}"
echo "- Commit: ${head_sha}"
echo "- Commit date: ${commit_date}"
echo "- Canonical host: https://${deploy_host}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "branch_name=${ref_name}"
    echo "head_sha=${head_sha}"
    echo "head_short_sha=${head_short_sha}"
    echo "commit_date=${commit_date}"
  } >> "$GITHUB_OUTPUT"
fi
