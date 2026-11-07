import { tester } from './helpers.ts';
import { seeded } from '../src/helpers.ts';
import assert from 'node:assert/strict';
import { CHARS, frames, type Cell } from '../src/scramble.ts';

const test = tester(import.meta.url);

const text = (cells: Cell[]): string => cells.map((c) => c.char).join('');
const all = (from: string, to: string, options = {}) => [...frames(from, to, options, seeded())];

test('ends on the target text', () => {
  const steps = all('hello', 'world');
  assert.equal(text(steps.at(-1)!), 'world');
  assert.ok(steps.at(-1)!.every((c) => !c.scrambled));
});

test('starts from the old text', () => {
  const steps = all('abc', 'xyz', { stagger: 10 });
  const first = steps[0];
  first.forEach((c, i) => assert.ok(c.scrambled || c.char === 'abc'[i] || c.char === 'xyz'[i]));
});

test('grows and shrinks', () => {
  assert.equal(text(all('', 'grow').at(-1)!), 'grow');
  assert.equal(text(all('shrinking', 'ok').at(-1)!), 'ok');
});

test('scrambles with the given chars', () => {
  for (const cells of all('', 'scramble me', { chars: '01' })) {
    for (const c of cells) if (c.scrambled) assert.ok('01'.includes(c.char));
  }
});

test('uses the default chars', () => {
  for (const cells of all('', 'defaults')) {
    for (const c of cells) if (c.scrambled) assert.ok(CHARS.includes(c.char));
  }
});

test('keeps spaces', () => {
  for (const cells of all('a b c', 'x y z')) {
    assert.equal(cells[1].char, ' ');
    assert.equal(cells[3].char, ' ');
  }
});

test('finishes within stagger + settle frames', () => {
  const steps = all('', 'quite a long sentence here', { stagger: 5, settle: 7 });
  assert.ok(steps.length <= 5 + 7 + 1);
});

test('handles emoji as single characters', () => {
  const steps = all('', 'hi 👋');
  assert.equal(steps.at(-1)!.length, 4);
  assert.equal(text(steps.at(-1)!), 'hi 👋');
});

test('ignores undefined options', () => {
  const steps = all('', 'abc', { chars: undefined, stagger: undefined });
  assert.equal(text(steps.at(-1)!), 'abc');
});
