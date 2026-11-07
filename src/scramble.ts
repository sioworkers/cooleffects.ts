// letters flicker through random characters, then settle into the text

import { withDefaults } from './helpers.ts';

export interface ScrambleOptions {
  /** text to scramble into; several strings cycle; defaults to the element's text */
  strings?: string | string[];
  /** characters used while scrambling */
  chars?: string;
  /** ms per frame */
  speed?: number;
  /** most frames a letter waits before it starts scrambling */
  stagger?: number;
  /** most frames a letter scrambles before it settles */
  settle?: number;
  /** ms to wait on each string before the next */
  pause?: number;
  /** start over after the last string */
  loop?: boolean;
}

export interface Cell {
  char: string;
  scrambled: boolean;
}

export interface Scramble {
  /** scrambles the current text and settles back */
  replay(): void;
  stop(): void;
}

export const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!<>-_/[]{}=+*^?#';

// change these to change every scramble on the page
export const defaults = {
  chars: CHARS,
  speed: 30,
  stagger: 0,
  settle: 35,
  pause: 2000,
  loop: false,
};

const blank = (c: string): boolean => c === '' || /\s/.test(c);

// every frame of turning one text into another
export function* frames(
  from: string,
  to: string,
  options: ScrambleOptions = {},
  rand: () => number = Math.random,
): Generator<Cell[]> {
  const { chars, stagger, settle } = withDefaults(defaults, options);
  const pool = Array.from(chars);
  const a = Array.from(from);
  const b = Array.from(to);
  const randomChar = (): string => pool[Math.floor(rand() * pool.length)];

  const plan = Array.from({ length: Math.max(a.length, b.length) }, (_, i) => {
    const start = Math.floor(rand() * stagger);
    return {
      from: a[i] ?? '',
      to: b[i] ?? '',
      start,
      end: start + 1 + Math.floor(rand() * settle),
      noise: randomChar(),
    };
  });
  const last = Math.max(0, ...plan.map((p) => p.end));

  for (let frame = 0; frame <= last; frame++) {
    yield plan.map((p): Cell => {
      if (frame >= p.end) return { char: p.to, scrambled: false };
      if (frame < p.start) return { char: p.from, scrambled: false };
      // spaces stay spaces
      if (blank(p.to) && blank(p.from)) return { char: p.to, scrambled: false };
      if (rand() < 0.3) p.noise = randomChar();
      return { char: p.noise, scrambled: true };
    });
  }
}

const escape = (c: string): string =>
  c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c;

function html(cells: Cell[]): string {
  return cells
    .map((c) => (c.scrambled ? `<span class="scramble-char">${escape(c.char)}</span>` : escape(c.char)))
    .join('');
}

let styled = false;
function addStyle(): void {
  if (styled) return;
  styled = true;
  const style = document.createElement('style');
  style.textContent = '.scramble-char{opacity:.55}';
  document.head.appendChild(style);
}

export function scramble(target: Element | string, options: ScrambleOptions = {}): Scramble {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) throw new Error(`scramble: no element for ${String(target)}`);

  const o = withDefaults(defaults, options);
  const given = options.strings ?? el.textContent ?? '';
  const strings = Array.isArray(given) ? given : [given];

  const text = document.createElement('span');
  text.setAttribute('aria-hidden', 'true');
  el.replaceChildren(text);
  el.setAttribute('aria-label', strings.join(' '));

  let shown = '';
  let index = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  // no animation for reduced motion
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    text.textContent = strings[strings.length - 1] ?? '';
    return { replay() {}, stop() {} };
  }
  addStyle();

  const run = (to: string, then?: () => void): void => {
    clearTimeout(timer);
    const steps = frames(shown, to, o);
    const tick = (): void => {
      const next = steps.next();
      if (next.done) {
        shown = to;
        then?.();
        return;
      }
      text.innerHTML = html(next.value);
      timer = setTimeout(tick, o.speed);
    };
    tick();
  };

  const advance = (): void => {
    const last = index === strings.length - 1;
    if (last && !o.loop) return;
    timer = setTimeout(() => {
      index = (index + 1) % strings.length;
      run(strings[index], advance);
    }, o.pause);
  };

  run(strings[0] ?? '', advance);

  return {
    replay() {
      run(shown, advance);
    },
    stop() {
      clearTimeout(timer);
    },
  };
}

// auto-start <h1 data-scramble="text" data-loop>, data-scramble-chars sets the characters, data-scramble-hover replays on hover
function auto(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-scramble]')) {
    const attr = el.dataset.scramble;
    const s = scramble(el, {
      strings: attr || undefined,
      loop: el.hasAttribute('data-loop') || undefined,
      chars: el.dataset.scrambleChars || undefined,
    });
    if (el.hasAttribute('data-scramble-hover')) el.addEventListener('mouseenter', () => s.replay());
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', auto);
  } else {
    auto();
  }
}
