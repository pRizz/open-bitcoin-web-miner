#!/bin/bash

cat .env.sentry-build-plugin
source .env.sentry-build-plugin
pnpm build-and-deploy
