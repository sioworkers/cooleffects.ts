import { test } from 'node:test';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// test() that prefixes names with the source file, e.g. "hello.ts: ..."
export function tester(url: string): (name: string, fn: () => void | Promise<void>) => void {
  const file = basename(fileURLToPath(url)).replace(/\.test\.ts$/, '.ts');
  return (name, fn) => {
    test(`${file}: ${name}`, fn);
  };
}
