// src/helpers.ts
function withDefaults(defaults2, options) {
  const set = Object.entries(options).filter(([, v]) => v !== void 0);
  return { ...defaults2, ...Object.fromEntries(set) };
}

// src/scramble.ts
var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!<>-_/[]{}=+*^?#";
var defaults = {
  chars: CHARS,
  speed: 30,
  stagger: 0,
  settle: 35,
  pause: 2e3,
  loop: false
};
var blank = (c) => c === "" || /\s/.test(c);
function* frames(from, to, options = {}, rand = Math.random) {
  const { chars, stagger, settle } = withDefaults(defaults, options);
  const pool = Array.from(chars);
  const a = Array.from(from);
  const b = Array.from(to);
  const randomChar = () => pool[Math.floor(rand() * pool.length)];
  const plan = Array.from({ length: Math.max(a.length, b.length) }, (_, i) => {
    const start = Math.floor(rand() * stagger);
    return {
      from: a[i] ?? "",
      to: b[i] ?? "",
      start,
      end: start + 1 + Math.floor(rand() * settle),
      noise: randomChar()
    };
  });
  const last = Math.max(0, ...plan.map((p) => p.end));
  for (let frame = 0; frame <= last; frame++) {
    yield plan.map((p) => {
      if (frame >= p.end) return { char: p.to, scrambled: false };
      if (frame < p.start) return { char: p.from, scrambled: false };
      if (blank(p.to) && blank(p.from)) return { char: p.to, scrambled: false };
      if (rand() < 0.3) p.noise = randomChar();
      return { char: p.noise, scrambled: true };
    });
  }
}
var escape = (c) => c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c;
function html(cells) {
  return cells.map((c) => c.scrambled ? `<span class="scramble-char">${escape(c.char)}</span>` : escape(c.char)).join("");
}
var styled = false;
function addStyle() {
  if (styled) return;
  styled = true;
  const style = document.createElement("style");
  style.textContent = ".scramble-char{opacity:.55}";
  document.head.appendChild(style);
}
function scramble(target, options = {}) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) throw new Error(`scramble: no element for ${String(target)}`);
  const o = withDefaults(defaults, options);
  const given = options.strings ?? el.textContent ?? "";
  const strings = Array.isArray(given) ? given : [given];
  const text = document.createElement("span");
  text.setAttribute("aria-hidden", "true");
  el.replaceChildren(text);
  el.setAttribute("aria-label", strings.join(" "));
  let shown = "";
  let index = 0;
  let timer;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    text.textContent = strings[strings.length - 1] ?? "";
    return { replay() {
    }, stop() {
    } };
  }
  addStyle();
  const run = (to, then) => {
    clearTimeout(timer);
    const steps = frames(shown, to, o);
    const tick = () => {
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
  const advance = () => {
    const last = index === strings.length - 1;
    if (last && !o.loop) return;
    timer = setTimeout(() => {
      index = (index + 1) % strings.length;
      run(strings[index], advance);
    }, o.pause);
  };
  run(strings[0] ?? "", advance);
  return {
    replay() {
      run(shown, advance);
    },
    stop() {
      clearTimeout(timer);
    }
  };
}
function auto() {
  for (const el of document.querySelectorAll("[data-scramble]")) {
    const attr = el.dataset.scramble;
    const s = scramble(el, {
      strings: attr || void 0,
      loop: el.hasAttribute("data-loop") || void 0,
      chars: el.dataset.scrambleChars || void 0
    });
    if (el.hasAttribute("data-scramble-hover")) el.addEventListener("mouseenter", () => s.replay());
  }
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", auto);
  } else {
    auto();
  }
}
export {
  CHARS,
  defaults,
  frames,
  scramble
};
//# sourceMappingURL=scramble.js.map
