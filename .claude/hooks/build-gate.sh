#!/usr/bin/env bash
# Stop hook: refuse to end the turn while `npm run build` is failing.
# Exit 2 on failure blocks Stop and returns stderr to the agent, which then
# keeps working on the build. After eight blocks in a row, Claude Code ends the turn anyway.
set -euo pipefail

if npm run build >/tmp/clash-build.log 2>&1; then
  exit 0
fi

echo "npm run build is failing — fix it before you end the turn:" >&2
tail -n 40 /tmp/clash-build.log >&2
exit 2
