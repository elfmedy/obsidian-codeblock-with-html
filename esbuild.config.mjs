import { context } from 'esbuild';
const production = process.argv.includes('production');
const build = await context({
  entryPoints: ['src/main.ts'], bundle: true, format: 'cjs', target: 'es2020',
  external: ['obsidian', '@codemirror/state', '@codemirror/view', '@codemirror/language'],
  outfile: 'main.js', sourcemap: production ? false : 'inline', minify: production, logLevel: 'info',
});
if (production) { await build.rebuild(); await build.dispose(); } else await build.watch();
