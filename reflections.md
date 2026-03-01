# Sprint 1 Reflection — Resurrect

## How the Rules File Bridges PRD to Implementation

The most valuable thing `CLAUDE.md` did was lock in the right architecture before any product code was written. Without it, the AI defaulted to whatever stack felt lowest-friction for the feature description — which turned out to be Vite + plain JSX, no server, no database, and authentication faked entirely in `localStorage`. That's fine for a weekend demo, but it's the wrong call for Resurrect, where server-side milestone gating and a public Flake Rate are core trust mechanisms. You simply can't enforce "collaborators only unlock project files after completing a milestone" on the client.

Naming the stack explicitly in `CLAUDE.md` — Next.js 14 App Router, TypeScript, Prisma, SQLite, JWT — meant the AI's first move was the right one, and every decision after that built on a solid foundation instead of fighting against a bad one.

The rule with the clearest payoff was the 20-line controller limit paired with the `lib/` extraction requirement. The register route ended up at exactly 24 lines and does nothing except call `lib/db/user.ts`, `lib/auth/password.ts`, and `lib/auth/session.ts` in sequence. The AI didn't need to be hand-held through the separation — the constraint created enough pressure that it happened naturally. In the no-rules version, the same logic was all crammed into `AuthContext.jsx`: state, validation, storage, and routing in one file with no real boundaries.

Zod coverage was another concrete win. The rule "Zod validates all API inputs — never trust raw request bodies" produced `lib/validators/auth.ts` and `lib/validators/profile.ts` as first-class outputs, not things bolted on later. The no-rules version did ad-hoc checks inline inside components (`if (form.password.length < 6)`), no schema, no structured error messages, and a minimum password length of 6 instead of 8. Small difference in isolation; meaningful when multiplied across every form in the app.

The CSS rule ("Tailwind utility classes only — no custom CSS files except `globals.css`") produced the most visually obvious difference: `globals.css` in Resurrect is 3 lines of `@tailwind` directives. The no-rules version generated a 427-line hand-crafted stylesheet with CSS custom properties. Neither approach is inherently wrong, but only one stays consistent with the rest of the codebase, and consistency is what keeps AI-assisted iteration coherent across sessions.

Where the rules file fell short was at the *product* layer — the PRD details that don't reduce to a linting rule. Things like the Flake Rate, the Handshake Agreement flow, and the copy policy ("never say abandoned, say paused") needed explicit re-prompting per feature. The architecture landed correctly; the product voice needed more guidance than the current rules file provides.

---

## How the GitHub Scrum Setup Organizes AI-Assisted Development

The GitHub Project board served a different function here than it does on a traditional team: it acted as a memory layer for the AI. Because each issue had acceptance criteria written as a checklist, it was straightforward to paste an issue directly into a prompt and get implementation targeted at those specific criteria rather than a generic interpretation of the feature. Issues that had vague or missing checklists predictably produced vaguer output.

The milestone structure (Sprint 1 / Sprint 2) also helped with scope creep. Features gated to Sprint 2 — the Co-op Board, Handshake Agreements, the Micro-Task AI Engine — didn't bleed into Sprint 1 prompts because they had a clear home elsewhere. Without that boundary it would have been easy to let the AI speculate forward into infrastructure that wasn't built yet.

The branch naming convention (`feature/42-short-description`) turned out to be useful specifically because it tied commits back to issues. Across multiple sessions, the branch name was the fastest way to reconstruct which issue a piece of code was addressing and whether the acceptance criteria had actually been met.

The main gap: the board tracked code state, not AI session state. A prompt could produce code that looked "Done" on the board while leaving edge cases unhandled. Adding a convention — only closing an issue after manually verifying each acceptance criterion checkbox — would close that gap without much overhead.

---

## What to Add or Change for Sprint 2

### Rules file changes

The most important addition would be a dedicated PRD reference section — a condensed version of Resurrect's core concepts (Vault, Co-op Board, Flake Rate, Handshake, milestone gating) written the way the AI should understand them for implementation purposes. The current `Product Summary` in `CLAUDE.md` covers the concepts accurately but doesn't give implementation direction. A short "Key Invariants" block — e.g., "file access is always derived from `milestone.status` on the server, never from any client-side state" — would make the security model self-enforcing across prompts without needing to re-explain it each session.

A testing strategy section is also missing. Sprint 1 has no test files. For Sprint 2 features touching the Co-op Board and Handshake flows — more stateful, more user-to-user interaction — specifying a framework (Vitest + React Testing Library), a pattern (test behavior not implementation), and a coverage expectation would get tests generated as part of the initial output rather than treated as a follow-up task.

### Scrum setup changes

Sprint 2 issues should include a "Definition of Done" field with at least one test case and a design reference. Sprint 1 issues were solid on architecture but thin on design intent — the AI had no mockup context to anchor component shape or interaction patterns. Even a rough wireframe attached to an issue would give it a more concrete implementation target.

It would also be worth adding a `security` label and tagging anything that touches auth, file access, or the Flake Rate calculation. Grouping those issues on the board makes it easier to audit them together rather than finding security-adjacent code scattered across unrelated PRs.
