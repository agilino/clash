# CLASH — product spec

You will build this app with Claude Code. This page says **what** the app does.
It does not say **how**. Claude Code and you decide that together, task by task.

## The idea

CLASH is a small social app for Berlin. The city is the social graph.
Everything happens at a place and a time on a map.

- A **clash** is an activity: a yoga session, a hackathon, a board-game night. It has a place, a date and a time.
- A **venue** is a reusable place: a café, a co-working space, a park. It can host many clashes.
- People **join** clashes. Hosts **accept or reject** requests. Everyone gets **notified**.

## Screens

| Screen | What it shows |
|---|---|
| Register, Login | Email and password. A new account can be created. |
| Dashboard | Counts: upcoming clashes, clashes I attend, clashes I host, venues. Lists: upcoming clashes, popular venues, recent activity. |
| Map | A full-screen map of Berlin. Pins for clashes and venues. A click on a pin opens a popup with a link. A click on empty map starts a new clash there. |
| Clashes | A list with search, a filter (upcoming, past, all) and sort (soonest, newest, popular). |
| Clash detail | Title, description, date, host, a small map, a **People** panel split into *Going* and pending *Requests*. Join or leave. Hosts see edit and delete instead. |
| New / edit clash | Title, description, date and time, a location picker on a map, an optional venue. Choosing a venue snaps the location to it. |
| Venues | A list with search and sort (name, popularity, newest). |
| Venue detail | Title, description, a small map, the clashes hosted there, a button "Host a clash here". |
| New / edit venue | Title, description, a location picker on a map. |
| My clashes, My venues | What I host and what I created. |
| My participations | My requests grouped into *Going*, *Awaiting approval*, *Declined*. |
| Search | A ⌘K command palette and a results page grouped into clashes, venues, people. |
| Profile | Name and bio can be edited. Email is read-only. Avatar upload with crop and zoom. |
| Public profile | A person's hosted clashes and added venues. |
| Settings | Theme: light, dark, system. Log out. |
| Notifications | A bell in the top bar with an unread dot. Mark one or all as read. A click opens the related clash or venue. |

## Rules

- Only logged-in people see the app. Register and login are public.
- A user can only edit or delete their **own** clashes and venues.
- A host cannot join their own clash.
- A user can request to join a clash once. The request is *pending* until the host accepts or rejects it.
- A user can leave a clash. This removes the request.
- Notifications are created when: someone requests to join my clash; my request is accepted or rejected; someone creates a clash at my venue.

## Data

Five kinds of records.

- **User** — name, email (unique), password (hashed), bio (optional), avatar (optional image).
- **Venue** — title, description, latitude, longitude, creator.
- **Clash** — title, description, date and time, latitude, longitude, venue (optional), creator.
- **Participation** — a user and a clash, with a status: `pending`, `accepted`, `rejected`. One per user and clash.
- **Notification** — for a user, with a type (`join`, `accepted`, `rejected`, `venue_clash`), a message, a read flag, and optional links to a clash, a venue and the acting user.

Status and type are plain strings with the values above.

## Tech

| Part | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Database | SQLite through Prisma 7 with the `better-sqlite3` adapter |
| UI | shadcn/ui and Tailwind CSS v4 |
| Map | Leaflet and react-leaflet with OpenStreetMap tiles |
| Auth | Own sessions: a signed JWT in an httpOnly cookie (`jose`), passwords hashed with `bcryptjs` |
| Validation | Zod schemas shared by forms and Server Actions |
| Avatar | `react-easy-crop`, stored as a base64 data URL in the database |
| Theme | `next-themes` |
| Dates | `date-fns` · Toasts: `sonner` |

## Seed data

Eight users, all with password `test`. Example: `anna.schmidt@example.com`.
Eight venues and eight clashes across Berlin, some in the past, some upcoming.

## Out of scope

Real-time notifications, social login, email, image hosting, deployment.
Keep these out unless a task says otherwise.

## The finished app

A reference build exists. You will compare your app with it at the end of Part II,
and you will work on the reference from Part III on.
