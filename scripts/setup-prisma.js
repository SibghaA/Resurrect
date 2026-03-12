#!/usr/bin/env node
/**
 * Selects the correct Prisma schema based on DATABASE_URL.
 * - postgresql:// or postgres:// → prisma/schema.postgres.prisma
 * - anything else (file:// etc.)  → prisma/schema.sqlite.prisma
 *
 * Reads .env if the variable isn't already in the environment.
 */

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

// Minimal .env parser — only reads DATABASE_URL if not already set.
function loadEnvFile() {
  const envPath = path.join(root, '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (!(key in process.env)) {
      process.env[key] = val
    }
  }
}

loadEnvFile()

const dbUrl = process.env.DATABASE_URL || ''
const isPostgres = /^postgre(s|sql):\/\//i.test(dbUrl)

const src = isPostgres
  ? path.join(root, 'prisma', 'schema.postgres.prisma')
  : path.join(root, 'prisma', 'schema.sqlite.prisma')

const dest = path.join(root, 'prisma', 'schema.prisma')

fs.copyFileSync(src, dest)

console.log(
  `[setup-prisma] Using ${isPostgres ? 'PostgreSQL' : 'SQLite'} schema (DATABASE_URL=${dbUrl || '(not set)'})`
)
