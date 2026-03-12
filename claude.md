# CLAUDE.md — Resurrect

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Postgres · Prisma · JWT (auth)

## Architecture

- Business logic lives in `lib/` — API routes are controllers only; if a route handler exceeds 20 lines, extract a service
- Zod validates all API inputs and AI outputs — never trust raw request bodies or LLM responses
- File access for collaborators is gated server-side by milestone completion status — never derive access rights on the client
- Server Components by default; `"use client"` only when the component needs interactivity or browser APIs
- Co-locate data fetching with the Server Component that needs it — avoid prop-drilling fetched data more than one level
- All Prisma queries go through `lib/db/` helpers — no raw queries scattered across route files
- Keep AI prompt templates in `lib/ai/prompts.ts` as named exports — never inline prompts in route handlers

## Code Standards

- No `any` in TypeScript — use `unknown` and narrow with Zod or type guards
- Functional React components only; props interfaces named `[Component]Props`
- Tailwind utility classes only — no custom CSS files except `globals.css`; no inline `style` props unless Tailwind genuinely can't handle it
- Every async UI path must handle all three states: loading, error, and success — no missing skeletons or silent failures
- Prefer `date-fns` for date formatting; never use `moment.js`
- No `console.log` in committed code; remove or replace with a logger before opening a PR

## Git Workflow

- Branch format: `feature/42-short-description` (type: `feature`, `fix`, `chore`, `docs`)
- Commit format: `feat(scope): description` — include `Closes #<issue>` on final commit
- All changes via PR — no direct commits to `main` or `develop`
- PRs require 1 review minimum; UI changes require a screenshot

## Key Invariants

These rules encode the security model and must never be violated regardless of feature context:

- **File access is always derived from `milestone.status` on the server** — never from any client-side state, URL param, or user-supplied flag
- **Handshake Agreement must be signed before any collaborator gains project file access** — the gate is the signed record in the DB, nothing else
- **Flake Rate is calculated server-side and always displayed** — it cannot be suppressed, hidden, or overridden by any user action or client request
- **Session tokens are verified on every protected API route** — never trust a client-supplied user ID; always read identity from `getSession()`
- **Co-op Board listing creation requires verified project ownership** — `getProjectById(projectId, session.sub)` must return a result before a listing is created
- **Zod validates all inputs at the boundary** — API route bodies, AI responses, and any external data must pass a Zod schema before use

## Testing

- **Framework**: Jest + ts-jest (`npm test`); coverage: `npm test -- --coverage`
- **Structure**: tests live in `__tests__/` mirroring the source tree (`__tests__/lib/`, `__tests__/api/`)
- **Pattern**: test behaviour not implementation — mock Prisma and external services, assert on HTTP response status and DB call arguments
- **Coverage target**: ≥ 80% statements and lines across `lib/` and `app/api/` (currently at ~99%)
- **Every new API route must cover**: 401 unauthenticated · 400 invalid input · 404 not found · happy path
- **DB helpers**: assert on Prisma mock call arguments — no real database in unit tests
- **AI services**: mock `generateCompletion` from `lib/ai/client.ts` — never call the Anthropic API in tests

## Product Summary

Resurrect helps users revive abandoned personal projects — solo or with a collaborator. The Vault is each user's private workspace: they create projects, define milestones, and use an AI Micro-Task Engine to decompose a stalled project into 10-minute actionable tasks. When a user needs help, they post to the public Co-op Board with "I Have / I Need" skill tags. Interested collaborators sign a Handshake Agreement (covering IP, credit, and exit terms) before gaining access to any project files. File access is milestone-gated — collaborators unlock deeper project content only as they complete agreed milestones. Trust is enforced via a Flake Rate: a public metric showing the percentage of collaborations a user has abandoned post-Handshake. Never use words like "abandoned," "failed," or "overdue" in UI copy — use "paused" and "waiting for you." Always display the Flake Rate on profiles and listings; it cannot be hidden.
