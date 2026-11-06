// src/confetti.ts
var COLORS = ["#0896b0", "#3ddbe8", "#0b5a7a", "#7fe3ee", "#5ab8d6", "#e2f3f7"];
var defaults = {
  count: 100,
  angle: 90,
  spread: 70,
  velocity: 12,
  decay: 0.95,
  gravity: 0.25,
  distance: 200,
  size: 10
};
var pick = (list2, rand) => list2[Math.floor(rand() * list2.length)];
function createParticles(x, y, options = {}, rand = Math.random) {
  const o = { ...defaults, ...options };
  const looks = options.images?.length ? [["image", options.images]] : options.text?.length ? [["text", options.text]] : [["square", o.colors ?? COLORS], ["circle", o.colors ?? COLORS]];
  return Array.from({ length: o.count }, () => {
    const angle = (o.angle + (rand() - 0.5) * o.spread) * Math.PI / 180;
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
      look: pick(values, rand)
    };
  });
}
function step(p, options = {}, dt = 1) {
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
function opacity(p, options = {}) {
  const { distance } = { ...defaults, ...options };
  return Math.max(0, 1 - p.travelled / distance);
}
function originPoint(origin) {
  if (!origin) return { x: innerWidth / 2, y: innerHeight / 2 };
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  if ("clientX" in origin) return { x: origin.clientX, y: origin.clientY };
  return origin;
}
var SPRITE = 64;
var images = /* @__PURE__ */ new Map();
var sprites = /* @__PURE__ */ new Map();
function image(url) {
  let img = images.get(url);
  if (!img) {
    img = new Image();
    img.src = url;
    images.set(url, img);
  }
  return img;
}
function sprite(p) {
  const key = `${p.kind}:${p.look}`;
  const cached = sprites.get(key);
  if (cached) return cached;
  const img = p.kind === "image" ? image(p.look) : void 0;
  if (img && !(img.complete && img.naturalWidth)) return void 0;
  const canvas2 = document.createElement("canvas");
  canvas2.width = canvas2.height = SPRITE;
  const ctx = canvas2.getContext("2d");
  if (img) {
    ctx.drawImage(img, 0, 0, SPRITE, SPRITE);
  } else {
    ctx.font = `${SPRITE * 0.75}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS[0];
    ctx.fillText(p.look, SPRITE / 2, SPRITE / 2);
  }
  sprites.set(key, canvas2);
  return canvas2;
}
function draw(ctx, p, options) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = opacity(p, options);
  if (p.kind === "text" || p.kind === "image") {
    const img = sprite(p);
    const s = p.size * 2.4;
    if (img) ctx.drawImage(img, -s / 2, -s / 2, s, s);
  } else {
    ctx.scale(1, Math.cos(p.wobble));
    ctx.fillStyle = p.look;
    if (p.kind === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    }
  }
  ctx.restore();
}
var bursts = [];
var canvas;
var last = 0;
function resize() {
  if (!canvas) return;
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function frame(now) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dt = Math.min((now - last) / (1e3 / 60), 4);
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
    canvas = void 0;
    removeEventListener("resize", resize);
  }
}
function confetti(options = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  options.images?.forEach(image);
  const { x, y } = originPoint(options.origin);
  return new Promise((done) => {
    bursts.push({ particles: createParticles(x, y, options), options, done });
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483647";
    document.body.appendChild(canvas);
    resize();
    addEventListener("resize", resize);
    last = performance.now();
    requestAnimationFrame(frame);
  });
}
var list = (value) => value ? value.split("|") : void 0;
if (typeof document !== "undefined") {
  document.addEventListener("click", (event) => {
    const el = event.target?.closest?.("[data-confetti]");
    if (!el) return;
    confetti({
      origin: el,
      text: list(el.dataset.confetti),
      colors: list(el.dataset.confettiColors),
      images: list(el.dataset.confettiImages)
    });
  });
}
export {
  COLORS,
  confetti,
  createParticles,
  opacity,
  step
};
//# sourceMappingURL=confetti.js.map
