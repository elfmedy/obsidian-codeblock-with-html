import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('test-results', { recursive: true });
await build({ entryPoints: ['tests/core.test.ts'], bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile: 'test-results/core.test.mjs' });
const result = spawnSync(process.execPath, ['--test', 'test-results/core.test.mjs'], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
