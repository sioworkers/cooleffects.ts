import { tester } from './helpers.ts';
import assert from 'node:assert/strict';
import { hello } from '../src/hello.ts';

const test = tester(import.meta.url);

test('greets the world by default', () => {
  assert.equal(hello(), 'Hello, World!');
});

test('greets by name', () => {
  assert.equal(hello('sioworker'), 'Hello, sioworker!');
});
