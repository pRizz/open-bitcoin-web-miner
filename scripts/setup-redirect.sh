#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

case "${1:-}" in
  bucket | cloudfront | dns | all)
    echo "Legacy S3 redirect commands are retired. Use bun scripts/configure-domains.ts [--phase prepare|cutover] [--apply]." >&2
    exit 1
    ;;
esac
exec bun scripts/configure-domains.ts "$@"
