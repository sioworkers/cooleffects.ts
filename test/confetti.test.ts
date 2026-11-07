import { tester } from './helpers.ts';
import { seeded } from '../src/helpers.ts';
import assert from 'node:assert/strict';
import { COLORS, createParticles, opacity, step } from '../src/confetti.ts';

const test = tester(import.meta.url);

test('makes count particles at the origin', () => {
  const particles = createParticles(10, 20, { count: 25 }, seeded());
  assert.equal(particles.length, 25);
  assert.ok(particles.every((p) => p.x === 10 && p.y === 20));
});

test('uses the default colors as paper', () => {
  const particles = createParticles(0, 0, {}, seeded());
  assert.ok(particles.every((p) => (p.kind === 'square' || p.kind === 'circle') && COLORS.includes(p.look)));
});

test('uses custom colors', () => {
  const colors = ['#f00', '#0f0'];
  const particles = createParticles(0, 0, { colors }, seeded());
  assert.ok(particles.every((p) => colors.includes(p.look)));
});

test('throws text instead of paper', () => {
  const particles = createParticles(0, 0, { text: ['🎉', 'A'] }, seeded());
  assert.ok(particles.every((p) => p.kind === 'text' && ['🎉', 'A'].includes(p.look)));
});

test('images win over text', () => {
  const particles = createParticles(0, 0, { images: ['a.png'], text: ['x'] }, seeded());
  assert.ok(particles.every((p) => p.kind === 'image' && p.look === 'a.png'));
});

test('stays inside the spread', () => {
  const particles = createParticles(0, 0, { angle: 90, spread: 60 }, seeded());
  for (const p of particles) {
    const deg = (Math.atan2(-p.vy, p.vx) * 180) / Math.PI;
    assert.ok(deg >= 60 - 1e-9 && deg <= 120 + 1e-9, `angle ${deg}`);
  }
});

test('gravity pulls pieces down', () => {
  const [p] = createParticles(0, 0, { count: 1, angle: 90, spread: 0 }, seeded());
  assert.ok(p.vy < 0);
  for (let i = 0; i < 100; i++) step(p);
  assert.ok(p.vy > 0);
});

test('fades out over distance px', () => {
  const [p] = createParticles(0, 0, { count: 1 }, seeded());
  assert.equal(opacity(p), 1);
  let last = 1;
  while (step(p, { distance: 200 })) {
    const now = opacity(p, { distance: 200 });
    assert.ok(now <= last);
    last = now;
  }
  assert.ok(p.travelled >= 200);
  assert.equal(opacity(p, { distance: 200 }), 0);
});
