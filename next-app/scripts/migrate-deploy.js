#!/usr/bin/env node
/**
 * Run prisma migrate deploy only when DATABASE_URL is set and valid.
 * Skips when missing so the build does not fail (e.g. before env is set in Vercel).
 */
const { execSync } = require('child_process');

const url = process.env.DATABASE_URL;
const valid =
  url &&
  typeof url === 'string' &&
  (url.startsWith('postgresql://') || url.startsWith('postgres://'));

if (valid) {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} else {
  console.log(
    'Skipping prisma migrate deploy (DATABASE_URL not set or invalid). Set DATABASE_URL in Vercel for migrations.'
  );
}
