#!/usr/bin/env node
/**
 * Runs the Vitest unit tests of the libraries under projects/myrmidon, one
 * library at a time (no watch mode).
 *
 * Tests resolve sibling libraries through tsconfig.json's
 * compilerOptions.paths -> ./dist/myrmidon/<name>, so build the libraries
 * first (npm run build:libs) when their sources changed.
 *
 * Usage:
 *   node scripts/test-libs.mjs              test all libraries
 *   node scripts/test-libs.mjs <name>...    test only these libraries
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LIBS_DIR = join(ROOT, 'projects', 'myrmidon');
const NG = join(ROOT, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');

const all = readdirSync(LIBS_DIR)
  .map((dir) => join(LIBS_DIR, dir, 'package.json'))
  .filter((path) => existsSync(path))
  .map((path) => JSON.parse(readFileSync(path, 'utf8')).name)
  .sort();

const requested = process.argv
  .slice(2)
  .map((r) => (r.startsWith('@myrmidon/') ? r : `@myrmidon/${r}`));
for (const name of requested) {
  if (!all.includes(name)) {
    console.error(`ERROR: unknown library "${name}"`);
    process.exit(1);
  }
}
const targets = requested.length ? requested : all;

const failed = [];
for (const [i, name] of targets.entries()) {
  console.log(`\n[${i + 1}/${targets.length}] ${name}`);
  const result = spawnSync(
    process.execPath,
    [NG, 'test', name, '--watch=false'],
    { cwd: ROOT, stdio: 'inherit' },
  );
  if (result.status !== 0) failed.push(name);
}

if (failed.length) {
  console.error(`\nFAILED: ${failed.join(', ')}`);
  process.exit(1);
}
console.log(`\nAll ${targets.length} libraries passed.`);
