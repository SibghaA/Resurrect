# Integration Tests

These tests run against a real Postgres database. They require:

- `DATABASE_URL` pointing to a test database (e.g. `postgresql://localhost:5432/resurrect_test`)
- `JWT_SECRET` set (already handled by jest.setup.js)

Run with: `npm run test:integration`

The test database is reset between test files using Prisma's `$executeRawUnsafe`.
