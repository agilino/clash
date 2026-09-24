# Clash Capacity

**As a host, I want to cap how many people can join my clash, so that the venue doesn't get
overcrowded.**

## Rules

### Rule: Must accept a join while accepted participants are below capacity

| Capacity | Accepted so far | Next join |
|---|---|---|
| 5 | 0 | accepted |
| 5 | 3 | accepted |

- The one where capacity is 5, 3 people are accepted and 4 more have a pending request — only
  accepted people count, so the next join is accepted.
- Counter-example: The one where capacity is 5 and 5 people are accepted — there is no free
  place, so this rule does not apply. The next rule does.

### Rule: Must waitlist a join once capacity is reached

- The one where capacity is 5 and 5 people are already accepted — the next join is waitlisted,
  not rejected.
- The one where capacity is 1 and 1 person is accepted — the next join is waitlisted.
- The one where the host lowers capacity from 8 to 5 while 7 people are accepted — the 7 stay
  accepted, and the next join is waitlisted.
- Counter-example: The one where capacity is 5 and exactly 4 people are accepted — the 5th join
  is still accepted, not waitlisted. The line is "at capacity", not "one below it".

### Rule: Must accept every join when no capacity is set

- The one where capacity is not set and 50 people have already joined — the next join is still
  accepted.
- The one where capacity is not set and nobody has joined yet — the first join is accepted.
- Counter-example: The one where capacity is set to 0. That is a capacity, not "no capacity",
  so every join is waitlisted.

## Resolved decisions

- **Lowering capacity after people have joined:** does not retroactively waitlist anyone
  already accepted. It only affects joins from that point on.
- **Pending requests:** do not count toward capacity. Only accepted participants do.
- **Out of scope:** promoting a waitlisted person automatically when a place frees up.
