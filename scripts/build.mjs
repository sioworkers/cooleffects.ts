// bundles src/*.ts into dist/<name>.js (esm) and dist/<name>.min.js (iife)
import { build } from 'esbuild';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';

// helpers.ts is shared code, not an effect
const entries = (await readdir('src')).filter(
  (f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.endsWith('.test.ts') && f !== 'helpers.ts',
);

await rm('dist', { recursive: true, force: true });

const camel = (s) => s.replace(/[-_.](\w)/g, (_, c) => c.toUpperCase());

for (const file of entries) {
  const name = path.basename(file, '.ts');
  const common = {
    entryPoints: [`src/${file}`],
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    logLevel: 'info',
  };
  await build({ ...common, format: 'esm', outfile: `dist/${name}.js` });
  await build({
    ...common,
    format: 'iife',
    globalName: camel(name),
    minify: true,
    outfile: `dist/${name}.min.js`,
  });
}
