import { build } from 'esbuild';
import { rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key } = process.env;
if (!url || !key) { console.error('Set env SUPABASE_URL dan SUPABASE_ANON_KEY (Vercel > Settings > Environment Variables)'); process.exit(1); }

rmSync('dist', { recursive: true, force: true }); mkdirSync('dist');
await build({
  entryPoints: { app: 'src/app.js', style: 'src/style.css' }, outdir: 'dist',
  minify: true, sourcemap: false, legalComments: 'none', target: 'es2020',
  define: { __SB_URL__: JSON.stringify(url), __SB_KEY__: JSON.stringify(key) },
});
writeFileSync('dist/index.html', readFileSync('src/index.html', 'utf8').replace(/>\s+</g, '><').trim());
console.log('Build OK -> dist/');
