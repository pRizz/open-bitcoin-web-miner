#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/remote-reporting.sh
source "$SCRIPT_DIR/lib/remote-reporting.sh"
setup_remote_report "git-tag-and-push-today"

# Get current date and time in the format yyyy-MM-ddThh-mm-ss
TAG_DATE=$(date '+%Y-%m-%dT%H-%M-%S')

# Create the tag name with "release" prefix
TAG_NAME="release/$TAG_DATE"

# Create and push the git tag
echo "Creating git tag: $TAG_NAME"
git tag "$TAG_NAME"
git push origin "$TAG_NAME"

echo "Successfully created and pushed tag: $TAG_NAME"
