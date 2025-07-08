#!/bin/bash

# Get current date and time in the format yyyy-MM-ddThh-mm-ss
TAG_DATE=$(date '+%Y-%m-%dT%H-%M-%S')

# Create the tag name with "release" prefix
TAG_NAME="release/$TAG_DATE"

# Create and push the git tag
echo "Creating git tag: $TAG_NAME"
git tag "$TAG_NAME"
git push origin "$TAG_NAME"

echo "Successfully created and pushed tag: $TAG_NAME"


