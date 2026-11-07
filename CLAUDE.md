# CLAUDE.md

CLASH — a small social app for Berlin. Product spec: `docs/SPEC.md`.
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Prisma 7 + SQLite.

@AGENTS.md

## Rules that prevent bugs here

- The Prisma client is generated to `lib/generated/prisma`. Import it through `lib/prisma.ts`, never from `@prisma/client`.
- Status and type fields are plain strings, not enums (SQLite has no enums). Allowed values live in `lib/constants.ts`.
- Next 16: `params` and `searchParams` are Promises. Always `await` them.
- Tailwind v4 is configured in `app/globals.css`. There is no `tailwind.config.js`. Do not create one.
- Build one slice at a time. Run `npx tsc --noEmit` before you call a step done.

## Commands

```bash
npm run dev          # dev server on :3000
npm run db:migrate   # prisma migrate dev
npm run db:seed      # destructive reseed; 8 users, password "test"
```
