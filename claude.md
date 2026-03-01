# CLAUDE.md — Resurrect

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · SQLite · Prisma · JWT (auth)

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

## Product Summary
Resurrect helps users revive abandoned personal projects — solo or with a collaborator. The Vault is each user's private workspace: they create projects, define milestones, and use an AI Micro-Task Engine to decompose a stalled project into 10-minute actionable tasks. When a user needs help, they post to the public Co-op Board with "I Have / I Need" skill tags. Interested collaborators sign a Handshake Agreement (covering IP, credit, and exit terms) before gaining access to any project files. File access is milestone-gated — collaborators unlock deeper project content only as they complete agreed milestones. Trust is enforced via a Flake Rate: a public metric showing the percentage of collaborations a user has abandoned post-Handshake. Never use words like "abandoned," "failed," or "overdue" in UI copy — use "paused" and "waiting for you." Always display the Flake Rate on profiles and listings; it cannot be hidden.