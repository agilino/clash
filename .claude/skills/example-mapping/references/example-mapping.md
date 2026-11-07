# Example Mapping

A short, structured conversation that turns a story into rules you can build and test against.
Four kinds of card:

| Card | What it is | In a spec |
|---|---|---|
| Story | The story under discussion | The `As a... I want... so that...` line |
| Rule | One testable business constraint | `### Rule: Should/Must ...` |
| Example | A concrete case that makes a rule unambiguous | `The one where ...` |
| Question | An unknown only the user can settle | Asked live, then deleted from the saved spec |

A healthy map has a handful of rules, several examples each, and no questions left. Many open
questions mean the story is not ready to build.

## Rules

- One rule, one constraint. Split anything joined by "and".
- State every rule as "Should..." or "Must...".
- A rule describes business behavior, not mechanism. No endpoints, screens or class names.

## Hunting for examples

Walk this list for every rule. Keep each case that probes a different point: a different
outcome, a different reason, or a different side of a boundary.

- The normal case, with real numbers.
- Just below the limit.
- Exactly at the limit.
- Just above the limit.
- Zero, empty or missing.
- Unlimited, or no limit set.
- The same thing twice, or two things at once.
- The same case for a different person or role.

Drop an example that changes only a name or a number and probes nothing new.

## Counter-examples

A counter-example is a valid case the rule deliberately does not cover, or where the outcome
flips. It is never a bug report. To find one, ask: "When would this rule not apply, and what
happens instead?" Good places to look: the edge of a limit, an empty value, an exempt role.

## Tables

When a rule has inputs that vary independently, use a table: one column per input, one for the
outcome, and a row for the boundary. A table shows gaps a list of sentences hides.

## Questions

Raise one whenever a rule depends on a decision only the business can make. Settle each with
`AskUserQuestion`, one at a time, offering 3 or 4 sensible options. Fold the answer into the
rule it affects, then delete the question. The saved spec has none left.

## Checklist

- [ ] Every rule starts with Should or Must and states one constraint.
- [ ] Every rule has several examples, the normal case first, none that only repeat another
      with a different name or number.
- [ ] Every rule has at least one counter-example, or a note on why none exists.
- [ ] Plain business language throughout.
- [ ] No open question left.

## A small worked example

A made-up story, unrelated to CLASH: "As a librarian, I want to limit how many books a member
can borrow, so that popular books circulate."

Rule: Must refuse a new loan once a member has 3 open loans.

| Open loans | New loan |
|---|---|
| 0 | allowed |
| 2 | allowed |
| 3 | refused |
| 4 | refused, possible after a limit was lowered |

- Counter-example: The one where a member with 3 open loans renews one of them. A renewal is
  not a new loan, so it is allowed.
