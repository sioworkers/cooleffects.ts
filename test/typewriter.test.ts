import { tester } from './helpers.ts';
import assert from 'node:assert/strict';
import { frames } from '../src/typewriter.ts';

const test = tester(import.meta.url);

const opts = { speed: 1, deleteSpeed: 2, pause: 3 };

test('one string and stops', () => {
  assert.deepEqual([...frames(['hi'], opts)], [
    { text: 'h', delay: 1 },
    { text: 'hi', delay: 3 },
  ]);
});

test('deletes between strings', () => {
  const texts = [...frames(['ab', 'c'], opts)].map((f) => f.text);
  assert.deepEqual(texts, ['a', 'ab', 'a', '', 'c']);
});

test('deletes with deleteSpeed', () => {
  const deletes = [...frames(['ab', 'c'], opts)].slice(2, 4);
  assert.ok(deletes.every((f) => f.delay === 2));
});

test('loops back to the first string', () => {
  const steps = frames(['a', 'b'], { ...opts, loop: true });
  const texts = Array.from({ length: 8 }, () => steps.next().value.text);
  assert.deepEqual(texts, ['a', '', 'b', '', 'a', '', 'b', '']);
});

test('handles emoji as single characters', () => {
  const texts = [...frames(['a👋'], opts)].map((f) => f.text);
  assert.deepEqual(texts, ['a', 'a👋']);
});

test('yields nothing for no strings', () => {
  assert.deepEqual([...frames([], opts)], []);
});
