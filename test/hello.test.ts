import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hello } from '../src/hello.ts';

test('hello greets the world by default', () => {
  assert.equal(hello(), 'Hello, World!');
});

test('hello greets by name', () => {
  assert.equal(hello('sioworker'), 'Hello, sioworker!');
});
