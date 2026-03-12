# Resurrect: Building an App to Save Your Side Projects (With Some Help From AI)

We've all got a graveyard. A folder somewhere full of half-built apps, abandoned APIs, and `TODO: finish this` comments dating back to 2021. Resurrect is an attempt to do something about that — an app that helps you pick up a stalled project, figure out what you actually need to do next, and (if you want) find someone to help you finish it.

Here's how it's built.

## The Stack

Next.js 14 App Router, TypeScript, Prisma, SQLite, JWT auth, and Zod for validation. Nothing exotic. The decision to use SQLite was deliberate — it's a side project tool, and side projects don't need a managed Postgres instance with connection pooling on day one. If Resurrect ever needs to scale, swapping out the Prisma datasource is a one-line change. Until then, a single file database keeps the local dev experience frictionless.

The App Router's Server Components did a lot of the heavy lifting on the architecture side. Data fetching lives right next to the component that needs it. There's no API layer for the frontend to call, no prop-drilling a user object five levels deep — the server component just reads from the DB and renders. `"use client"` only shows up when something actually needs browser APIs or interactivity.

## Keeping Route Handlers Honest

One architectural rule that paid off immediately: if a route handler goes over 20 lines, extract a service. It sounds arbitrary but it works. The register route, for example, does exactly four things — validates input, checks for an existing email, hashes the password, creates the user — and each of those is a one-line call into `lib/db/user.ts`, `lib/auth/password.ts`, or `lib/auth/session.ts`. The route itself is 24 lines and reads like pseudocode.

All business logic lives in `lib/`. Routes are controllers. It's a boring split but it made the codebase easy to test and easy to reason about across sessions.

## Zod Everywhere

Every API input goes through a Zod schema before it touches the database. Every AI response gets validated before it gets saved. This sounds like overhead but it's the opposite — it makes the error messages consistent, catches bad data early, and means you never have to write `if (typeof req.body.email !== 'string')` again.

The validators live in `lib/validators/` as named exports. `registerSchema`, `projectSchema`, `microTaskUpdateSchema` — each one is a single source of truth for what that data is supposed to look like. When a field changes, you change it once.

## The AI Micro-Task Engine

The most interesting piece is the Micro-Task Engine. You give it a project context and a milestone you want to hit, and it calls Claude (the Anthropic API) to break that milestone into 10-minute tasks. The prompt is strict: return a JSON array only, no markdown, no explanation, tasks between 1 and 60 minutes, categories from a fixed list.

The response goes straight into `aiTaskListSchema.parse()` before anything else happens. If Claude decides to be creative with the format, Zod throws and the API returns a 500 with a clear error. No half-written tasks, no corrupted batches.

The engine clears the previous task batch before saving the new one, so regenerating tasks for a milestone always gives you a clean slate. Each batch gets a `batchId` so you can trace which generation a task came from.

## Testing Without a Database

198 tests, 99% statement coverage, no real database. The trick is mocking the Prisma singleton at the module level with `jest.mock('@/lib/db/prisma')` and replacing each model method with `jest.fn()`. Tests assert on what arguments the mock was called with rather than on database state. It's faster, more predictable, and means the test suite runs in under 2 seconds.

API route tests import the handler functions directly and call them with a `NextRequest`. No test server, no HTTP overhead — just `const res = await POST(req)` and then `expect(res.status).toBe(201)`. The Next.js server components are tested the same way the browser would use them.

The Anthropic client gets mocked too. No real API calls in tests, ever. The mock returns whatever JSON the test wants, and the engine's parsing and storage logic gets exercised in isolation.

## What's Left

The Co-op Board and Handshake Agreement flows are the next pieces. They're the parts that make Resurrect more than a personal task manager — the trust layer where two people agree on what they're building together before any files get shared. That's where it gets interesting.
