// src/helpers.ts
function withDefaults(defaults2, options) {
  const set = Object.entries(options).filter(([, v]) => v !== void 0);
  return { ...defaults2, ...Object.fromEntries(set) };
}

// src/typewriter.ts
var defaults = {
  speed: 60,
  deleteSpeed: 30,
  pause: 1500,
  loop: false
};
function* frames(strings, options = {}) {
  const { speed, deleteSpeed, pause, loop } = withDefaults(defaults, options);
  if (strings.length === 0) return;
  do {
    for (let i = 0; i < strings.length; i++) {
      const chars = Array.from(strings[i]);
      const last = i === strings.length - 1;
      for (let n = 1; n <= chars.length; n++) {
        const done = n === chars.length;
        yield { text: chars.slice(0, n).join(""), delay: done ? pause : speed };
      }
      if (last && !loop) return;
      for (let n = chars.length - 1; n >= 0; n--) {
        yield { text: chars.slice(0, n).join(""), delay: deleteSpeed };
      }
    }
  } while (loop);
}
var styled = false;
function addStyle() {
  if (styled) return;
  styled = true;
  const style = document.createElement("style");
  style.textContent = ".typewriter-cursor{animation:typewriter-blink 1s step-end infinite}@keyframes typewriter-blink{50%{opacity:0}}";
  document.head.appendChild(style);
}
function typewriter(target, options = {}) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) throw new Error(`typewriter: no element for ${String(target)}`);
  const given = options.strings ?? el.textContent ?? "";
  const strings = Array.isArray(given) ? given : [given];
  const text = document.createElement("span");
  el.replaceChildren(text);
  el.setAttribute("aria-label", strings.join(" "));
  text.setAttribute("aria-hidden", "true");
  const cursor = options.cursor ?? "|";
  if (cursor !== false) {
    addStyle();
    const span = document.createElement("span");
    span.className = "typewriter-cursor";
    span.setAttribute("aria-hidden", "true");
    span.textContent = cursor;
    el.appendChild(span);
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    text.textContent = strings[strings.length - 1] ?? "";
    return { stop() {
    } };
  }
  const steps = frames(strings, options);
  let timer;
  const tick = () => {
    const next = steps.next();
    if (next.done) return;
    text.textContent = next.value.text;
    timer = setTimeout(tick, next.value.delay);
  };
  tick();
  return {
    stop() {
      clearTimeout(timer);
    }
  };
}
function auto() {
  for (const el of document.querySelectorAll("[data-typewriter]")) {
    const attr = el.dataset.typewriter;
    typewriter(el, {
      strings: attr ? attr.split("|") : void 0,
      loop: el.hasAttribute("data-loop") || void 0
    });
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
  defaults,
  frames,
  typewriter
};
//# sourceMappingURL=typewriter.js.map
