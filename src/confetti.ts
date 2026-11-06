// bursts confetti from a point, element or click

export interface ConfettiOptions {
  /** where it bursts from: a point in px, an element, or a mouse event; defaults to the middle of the screen */
  origin?: { x: number; y: number } | Element | MouseEvent;
  /** number of pieces */
  count?: number;
  /** direction in degrees, 90 is up */
  angle?: number;
  /** cone width in degrees */
  spread?: number;
  /** starting speed in px per frame */
  velocity?: number;
  /** speed kept each frame, 0..1 */
  decay?: number;
  /** px per frame added downwards each frame */
  gravity?: number;
  /** px a piece travels while fading out */
  distance?: number;
  /** piece size in px */
  size?: number;
  /** css colors for paper pieces */
  colors?: string[];
  /** letters or emoji to throw instead of paper */
  text?: string[];
  /** image urls to throw instead of paper */
  images?: string[];
}

export type Kind = 'square' | 'circle' | 'text' | 'image';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  wobble: number;
  wobbleSpeed: number;
  /** px travelled */
  travelled: number;
  size: number;
  kind: Kind;
  /** color, text or image url */
  look: string;
}

export const COLORS = ['#0896b0', '#3ddbe8', '#0b5a7a', '#7fe3ee', '#5ab8d6', '#e2f3f7'];

const defaults = {
  count: 100,
  angle: 90,
  spread: 70,
  velocity: 12,
  decay: 0.95,
  gravity: 0.25,
  distance: 200,
  size: 10,
};

const pick = <T>(list: T[], rand: () => number): T => list[Math.floor(rand() * list.length)];

export function createParticles(
  x: number,
  y: number,
  options: ConfettiOptions = {},
  rand: () => number = Math.random,
): Particle[] {
  const o = { ...defaults, ...options };
  const looks: [Kind, string[]][] = options.images?.length
    ? [['image', options.images]]
    : options.text?.length
      ? [['text', options.text]]
      : [['square', o.colors ?? COLORS], ['circle', o.colors ?? COLORS]];

  return Array.from({ length: o.count }, () => {
    const angle = ((o.angle + (rand() - 0.5) * o.spread) * Math.PI) / 180;
    const speed = o.velocity * (0.5 + rand() * 0.5);
    const [kind, values] = pick(looks, rand);
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      rotation: rand() * Math.PI * 2,
      spin: (rand() - 0.5) * 0.3,
      wobble: rand() * Math.PI * 2,
      wobbleSpeed: 0.05 + rand() * 0.1,
      travelled: 0,
      size: o.size * (0.7 + rand() * 0.6),
      kind,
      look: pick(values, rand),
    };
  });
}

// moves a particle forward by dt frames; returns false once it has faded out
export function step(p: Particle, options: ConfettiOptions = {}, dt = 1): boolean {
  const { decay, gravity, distance } = { ...defaults, ...options };
  const drag = decay ** dt;
  p.vx *= drag;
  p.vy = p.vy * drag + gravity * dt;
  p.x += (p.vx + Math.sin(p.wobble)) * dt;
  p.y += p.vy * dt;
  p.travelled += Math.hypot(p.vx, p.vy) * dt;
  p.rotation += p.spin * dt;
  p.wobble += p.wobbleSpeed * dt;
  return p.travelled < distance;
}

// 1 at the start, 0 once it has travelled distance px
export function opacity(p: Particle, options: ConfettiOptions = {}): number {
  const { distance } = { ...defaults, ...options };
  return Math.max(0, 1 - p.travelled / distance);
}

function originPoint(origin: ConfettiOptions['origin']): { x: number; y: number } {
  if (!origin) return { x: innerWidth / 2, y: innerHeight / 2 };
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  if ('clientX' in origin) return { x: origin.clientX, y: origin.clientY };
  return origin;
}

const SPRITE = 64;
const images = new Map<string, HTMLImageElement>();
const sprites = new Map<string, HTMLCanvasElement>();

function image(url: string): HTMLImageElement {
  let img = images.get(url);
  if (!img) {
    img = new Image();
    img.src = url;
    images.set(url, img);
  }
  return img;
}

// text and images are drawn once into a small canvas, then stamped every frame
function sprite(p: Particle): HTMLCanvasElement | undefined {
  const key = `${p.kind}:${p.look}`;
  const cached = sprites.get(key);
  if (cached) return cached;

  const img = p.kind === 'image' ? image(p.look) : undefined;
  if (img && !(img.complete && img.naturalWidth)) return undefined;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SPRITE;
  const ctx = canvas.getContext('2d')!;
  if (img) {
    ctx.drawImage(img, 0, 0, SPRITE, SPRITE);
  } else {
    ctx.font = `${SPRITE * 0.75}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS[0];
    ctx.fillText(p.look, SPRITE / 2, SPRITE / 2);
  }
  sprites.set(key, canvas);
  return canvas;
}

function draw(ctx: CanvasRenderingContext2D, p: Particle, options: ConfettiOptions): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = opacity(p, options);

  if (p.kind === 'text' || p.kind === 'image') {
    const img = sprite(p);
    const s = p.size * 2.4;
    if (img) ctx.drawImage(img, -s / 2, -s / 2, s, s);
  } else {
    // flip like paper
    ctx.scale(1, Math.cos(p.wobble));
    ctx.fillStyle = p.look;
    if (p.kind === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    }
  }
  ctx.restore();
}

interface Burst {
  particles: Particle[];
  options: ConfettiOptions;
  done: () => void;
}

const bursts: Burst[] = [];
let canvas: HTMLCanvasElement | undefined;
let last = 0;

function resize(): void {
  if (!canvas) return;
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function frame(now: number): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const dt = Math.min((now - last) / (1000 / 60), 4);
  last = now;
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.particles = b.particles.filter((p) => step(p, b.options, dt) && p.y < innerHeight + 50);
    b.particles.forEach((p) => draw(ctx, p, b.options));
    if (b.particles.length === 0) {
      bursts.splice(i, 1);
      b.done();
    }
  }

  if (bursts.length) {
    requestAnimationFrame(frame);
  } else {
    canvas.remove();
    canvas = undefined;
    removeEventListener('resize', resize);
  }
}

export function confetti(options: ConfettiOptions = {}): Promise<void> {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  options.images?.forEach(image);

  const { x, y } = originPoint(options.origin);
  return new Promise((done) => {
    bursts.push({ particles: createParticles(x, y, options), options, done });
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483647';
    document.body.appendChild(canvas);
    resize();
    addEventListener('resize', resize);
    last = performance.now();
    requestAnimationFrame(frame);
  });
}

// <button data-confetti> bursts on click; data-confetti="🎉|✨" throws text,
// data-confetti-colors="#f00|#0f0" and data-confetti-images="a.png|b.png" change the look
const list = (value: string | undefined): string[] | undefined => (value ? value.split('|') : undefined);

if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    const el = (event.target as Element | null)?.closest?.<HTMLElement>('[data-confetti]');
    if (!el) return;
    confetti({
      origin: el,
      text: list(el.dataset.confetti),
      colors: list(el.dataset.confettiColors),
      images: list(el.dataset.confettiImages),
    });
  });
}
