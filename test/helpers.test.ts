import { tester } from './helpers.ts';
import assert from 'node:assert/strict';
import { seeded, withDefaults } from '../src/helpers.ts';

const test = tester(import.meta.url);

test('options override defaults', () => {
  assert.deepEqual(withDefaults({ a: 1, b: 2 }, { b: 3 }), { a: 1, b: 3 });
});

test('undefined options keep the default', () => {
  assert.deepEqual(withDefaults({ a: 1, b: 2 }, { a: undefined, b: false }), { a: 1, b: false });
});

test('seeded repeats the same numbers', () => {
  const a = seeded(7);
  const b = seeded(7);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});

test('seeded stays between 0 and 1', () => {
  const rand = seeded();
  for (let i = 0; i < 1000; i++) {
    const n = rand();
    assert.ok(n >= 0 && n < 1);
  }
});
