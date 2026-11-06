// types text into an element, optionally deleting and looping

export interface TypewriterOptions {
  /** text to type; defaults to the element's text */
  strings?: string | string[];
  /** ms per typed character */
  speed?: number;
  /** ms per deleted character */
  deleteSpeed?: number;
  /** ms to wait after a string is typed */
  pause?: number;
  /** start over after the last string */
  loop?: boolean;
  /** cursor character, or false for none */
  cursor?: string | false;
}

export interface Frame {
  text: string;
  delay: number;
}

export interface Typewriter {
  stop(): void;
}

const defaults = {
  speed: 60,
  deleteSpeed: 30,
  pause: 1500,
  loop: false,
};

// every text state and how long to wait before showing the next one
export function* frames(strings: string[], options: TypewriterOptions = {}): Generator<Frame> {
  const { speed, deleteSpeed, pause, loop } = { ...defaults, ...options };
  if (strings.length === 0) return;
  do {
    for (let i = 0; i < strings.length; i++) {
      const chars = Array.from(strings[i]);
      const last = i === strings.length - 1;
      for (let n = 1; n <= chars.length; n++) {
        const done = n === chars.length;
        yield { text: chars.slice(0, n).join(''), delay: done ? pause : speed };
      }
      if (last && !loop) return;
      for (let n = chars.length - 1; n >= 0; n--) {
        yield { text: chars.slice(0, n).join(''), delay: deleteSpeed };
      }
    }
  } while (loop);
}

let styled = false;
function addStyle(): void {
  if (styled) return;
  styled = true;
  const style = document.createElement('style');
  style.textContent =
    '.typewriter-cursor{animation:typewriter-blink 1s step-end infinite}' +
    '@keyframes typewriter-blink{50%{opacity:0}}';
  document.head.appendChild(style);
}

export function typewriter(target: Element | string, options: TypewriterOptions = {}): Typewriter {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) throw new Error(`typewriter: no element for ${String(target)}`);

  const given = options.strings ?? el.textContent ?? '';
  const strings = Array.isArray(given) ? given : [given];

  const text = document.createElement('span');
  el.replaceChildren(text);
  el.setAttribute('aria-label', strings.join(' '));
  text.setAttribute('aria-hidden', 'true');

  const cursor = options.cursor ?? '|';
  if (cursor !== false) {
    addStyle();
    const span = document.createElement('span');
    span.className = 'typewriter-cursor';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = cursor;
    el.appendChild(span);
  }

  // no animation for reduced motion
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    text.textContent = strings[strings.length - 1] ?? '';
    return { stop() {} };
  }

  const steps = frames(strings, options);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tick = (): void => {
    const next = steps.next();
    if (next.done) return;
    text.textContent = next.value.text;
    timer = setTimeout(tick, next.value.delay);
  };
  tick();

  return {
    stop() {
      clearTimeout(timer);
    },
  };
}

// auto-start <span data-typewriter="first|second" data-loop>
function auto(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-typewriter]')) {
    const attr = el.dataset.typewriter;
    typewriter(el, {
      strings: attr ? attr.split('|') : undefined,
      loop: el.hasAttribute('data-loop'),
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', auto);
  } else {
    auto();
  }
}
