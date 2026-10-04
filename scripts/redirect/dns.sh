#!/usr/bin/env bash
set -euo pipefail

echo "This legacy redirect script is retired to prevent restoring the old redirect direction." >&2
echo "Use bun scripts/configure-domains.ts [--phase prepare|cutover] [--apply]." >&2
exit 1
