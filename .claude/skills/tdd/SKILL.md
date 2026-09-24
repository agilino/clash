---
name: tdd
description: Run one red-green-refactor cycle for a rule from a spec in
  docs/specs/. Writes one failing test, the minimum code to pass it,
  refactors, then stops. Never edits an existing test.
argument-hint: "<rule from docs/specs/*.md>"
allowed-tools: Read, Write, Edit, Bash
disable-model-invocation: true
---

One cycle means one rule, or one new example of a rule already covered — not "keep going until
the whole spec passes". Stop after REFACTOR and report; wait for the next `/tdd` call before
starting another cycle.

## RED

Write exactly one new failing test for the rule named in `$ARGUMENTS`, using its exact wording
from the spec. Run `npm run test`.

It must fail on an assertion — the wrong value, or the wrong branch taken — not on a compile or
import error. A test that errors is testing plumbing, not the rule. If it already passes without
any change, stop and say so instead of continuing.

## GREEN

Write the minimum code to make that one test pass, in the file the rule belongs to. Run
`npm run test` and confirm every test passes, not just the new one. Don't implement anything
beyond what this test requires, and don't touch any other test — especially not the one you just
wrote. If GREEN would require editing a test to pass, that's a sign the RED test was wrong; stop
and say so instead of editing it.

## REFACTOR

Clean up duplication in the code you just touched, in the test you just wrote, or both. Re-run
the entire suite, not just the new test.

## STOP

Report: the rule, the test file and name, pass or fail, and one sentence on what the next
uncovered rule or example is. Then wait — don't start another cycle on your own.
