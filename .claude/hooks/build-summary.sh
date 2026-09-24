#!/usr/bin/env bash
# PostToolUse hook for `npm run build`: replaces the long build log with a short
# summary before it reaches the model's context window.
# Input: the hook JSON on stdin (tool_response.stdout / stderr / exit_code).
# Output: JSON with hookSpecificOutput.updatedToolOutput, exit 0.
set -euo pipefail
input="$(cat)"
stdout="$(jq -r '.tool_response.stdout // ""' <<<"$input")"
stderr="$(jq -r '.tool_response.stderr // ""' <<<"$input")"
code="$(jq -r '.tool_response.exit_code // 0' <<<"$input")"

if [[ "$code" == "0" ]]; then
  status="npm run build: PASS"
else
  status="npm run build: FAIL (exit $code)"
fi
errors="$(printf '%s\n%s' "$stdout" "$stderr" | grep -ciE 'error' || true)"
tail5="$(printf '%s\n%s' "$stdout" "$stderr" | grep -v '^\s*$' | tail -n 5 || true)"
summary="$(printf '%s · %s error line(s)\n%s' "$status" "$errors" "$tail5")"

jq -cn --arg s "$summary" '{hookSpecificOutput: {hookEventName: "PostToolUse", updatedToolOutput: $s}}'
