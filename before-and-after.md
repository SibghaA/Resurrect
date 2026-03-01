When the Resurrect repo with claude.md was provided, the CLAUDE.md stack prescription was followed to the letter.

Separation of concerns is clean and enforced by the rules:
lib/auth/jwt.ts        ← token sign/verify only
lib/auth/password.ts   ← bcrypt hash/compare only
lib/auth/session.ts    ← cookie read/write using jwt helpers
lib/db/user.ts         ← all Prisma queries in one place
lib/validators/auth.ts ← Zod schemas for register/login
lib/validators/profile.ts ← Zod schema for profile

Every route handler is a thin controller. The longest (register/route.ts) is 24 lines — right at the
edge of the ">20 lines → extract" rule, and nearly all business logic is already extracted. Server Components are used for DashboardPage and ProfileEditPage (both are async functions
with no "use client"), and "use client" is added only where DOM interaction is required.

Consistent cookie-based JWT auth — httpOnly, sameSite: lax, secure in production. Auth state survives page refreshes without a client-side store.

Resurrect without claude.md:

The AI without a CLAUDE.md made different choices:

chose Vite + JSX over Next.js + TypeScript. No server, no database, no Zod. Authentication is entirely simulated in localStorage.

I had Claude scan both attempts for security issues and it found this issue in the folder without Claude.mdL

"""
Critical security gap: Passwords are stored and compared in plaintext:
// AuthContext.jsx:52
if (!found || found.password !== password) {

This is a direct consequence of having no server — but it's still a real vulnerability if this pattern were ever promoted to production.

No input validation layer — each component does its own ad hoc checks (if (form.password.length < 6)), and the minimum is 6 characters vs. the 8 set in Resurrect's Zod schema.
"""

CSS approach also differs: Resurrect (no claude.md) uses a 427-line hand-crafted index.css with CSS custom properties.

Resurrect's globals.css is 3 lines (@tailwind directives only). The CLAUDE.md rule — "Tailwind utility classes only — no custom CSS files except globals.css" — is respected by Resurrect and ignored by Resurrect (no claude.md).

Overall, with the Claude.md we were able to control the agent and direct it towards a better stack for our purposes and a more secure API.