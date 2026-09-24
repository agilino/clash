---
paths:
  - "app/actions/**"
---

# Server Action rules

- Every Server Action that mutates an EXISTING row must check that the current user owns it,
  not just that `requireUser()` ran. `requireUser()` protects the page; a Server Action is a
  public endpoint that anyone with a valid session cookie can call directly, with any
  arguments, without ever opening the page.
- Look up the row first, confirm it exists, then compare its owner field (`creatorId`) against
  the current user's id before mutating or deleting it.
