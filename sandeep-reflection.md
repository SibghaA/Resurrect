# Resurrect: Putting Skin in the Game (The Trust & Collaboration Layer)

We've all got a graveyard of half-built apps. But the hardest part of reviving a project isn't just the code—it's the risk of collaborating with someone new only for them to vanish halfway through. Resurrect isn't just a project restarter; it's a trust engine designed to make sure if you pick up a shovel, you aren't digging alone.

Here's how we built the layer that turns strangers into partners.

## Engineering Trust: The Flake Rate

The biggest friction in side projects is "flaking"—starting a collaboration and then disappearing. We needed a way to measure reliability that wasn't just subjective reviews. We built the **Flake Rate**.

The core of this is the `isOverdueAbandoned` logic in `lib/flake-rate.ts`. We settled on a "2x deadline rule": if a milestone is more than twice as old as its original duration and there’s been zero communication from the collaborator since the deadline, the project is auto-marked as **Abandoned**.

This isn't just a label. It's an architectural invariant. The Flake Rate is a percentage calculated strictly from resolved collaborations. If you abandon a project, your rate goes up, and you become less visible on the Co-op Board. It turns "ghosting" from a minor annoyance into a real reputation cost.

## Handshake Agreements: Proof of Intent

Before any project files are shared or a single line of code is written in collaboration, both parties have to sign a **Handshake Agreement**.

Built into `lib/pdf.ts`, this flow generates a legal-lite document covering IP ownership, credit, and exit clauses. We aren't just saving a record; we're creating integrity. Every generated agreement gets a SHA-256 hash (`computePdfHash`) that is stored in the database. If there's ever a dispute, we have an immutable fingerprint of exactly what was agreed upon at the start of the handshake.

To keep development frictionless, we implemented a "local fallback" for the storage layer. While the production setup is wired for AWS S3, the local environment defaults to `/tmp/resurrect-agreements`. It means you can test the entire legal-to-code pipeline without needing an AWS account or an active internet connection.

## Personalizing the Co-op Board

The Co-op Board could easily have become a generic list of "I need a dev." To prevent that, we built a personalized skill matcher in `lib/skill-matcher.ts`.

It doesn't just list projects; it calculates a `matchScore` based on the intersection of a user's `skillTags` and a project's `skillTagsNeed`. We use a simple scoring heuristic that weights exact matches higher and sorts the feed to show you where you'd be most valuable first. This ensures that the first thing a user sees is a project where they can actually make an impact, reducing the "where do I even start?" friction.

## Testing the Trust Layer

Because the Handshake and Flake Rate flows are the security-critical parts of the app, we aimed for—and hit—100% test coverage for these modules.

Testing these was tricky because they involve side effects: PDF generation, timestamps, and external API calls. The solution was strict module-level mocking. In `flake-rate.test.ts`, we mock the Prisma singleton to simulate "Active" vs. "Abandoned" states without a database. For the Handshake flow, we mock the PDF generator to return simple text buffers, allowing us to assert on the *content* of the agreement and the *state* of the signatures without the overhead of a PDF rendering engine.

It keeps the test suite fast (under 2 seconds) while guaranteeing that the trust invariants we promised in the PRD actually hold up in the code.
