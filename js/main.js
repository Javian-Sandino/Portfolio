/* ============================================================
   Javian Sandino — Portfolio interactions
   ============================================================ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===== Neural network hero canvas =====
   Drifting nodes connected by proximity; the pointer acts as a
   stimulus that brightens nearby synapses. */
(function neuralCanvas() {
  const canvas = document.getElementById("neuralCanvas");
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  let width, height, nodes;
  const pointer = { x: -9999, y: -9999 };

  const NODE_COLOR = "rgba(124, 108, 255, 0.9)";
  const LINK_DIST = 150;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const count = Math.min(110, Math.floor((width * height) / 14000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.2 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function step(t) {
    ctx.clearRect(0, 0, width, height);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    }

    // synapses
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > LINK_DIST) continue;

        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const pd = Math.hypot(mx - pointer.x, my - pointer.y);
        const excite = Math.max(0, 1 - pd / 220); // pointer stimulus
        const base = (1 - dist / LINK_DIST) * 0.22;

        ctx.strokeStyle = excite > 0.05
          ? `rgba(79, 216, 255, ${base + excite * 0.5})`
          : `rgba(124, 108, 255, ${base})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // nodes with a gentle firing flicker
    for (const n of nodes) {
      const flicker = 0.65 + 0.35 * Math.sin(t / 600 + n.phase);
      ctx.globalAlpha = flicker;
      ctx.fillStyle = NODE_COLOR;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(step);
  }

  window.addEventListener("resize", resize);
  canvas.parentElement.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  });
  canvas.parentElement.addEventListener("pointerleave", () => {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  resize();
  requestAnimationFrame(step);
})();

/* ===== Scroll reveal ===== */
(function scrollReveal() {
  const els = document.querySelectorAll(".reveal");
  if (prefersReducedMotion) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
})();

/* ===== Count-up stats ===== */
(function countUp() {
  const nums = document.querySelectorAll(".fact-card__num[data-count]");
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        io.unobserve(el);
        const target = parseInt(el.dataset.count, 10);
        if (prefersReducedMotion) {
          el.textContent = target;
          continue;
        }
        const dur = 1400;
        const start = performance.now();
        (function tick(now) {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      }
    },
    { threshold: 0.5 }
  );
  nums.forEach((el) => io.observe(el));
})();

/* ===== Nav: scrolled state, active link, mobile menu ===== */
(function nav() {
  const navEl = document.getElementById("nav");
  const links = document.querySelectorAll(".nav__links a");
  const burger = document.getElementById("navBurger");
  const menu = document.getElementById("navLinks");

  window.addEventListener("scroll", () => {
    navEl.classList.toggle("is-scrolled", window.scrollY > 10);
  }, { passive: true });

  // highlight the section in view
  const sections = [...links]
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((a) =>
          a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`)
        );
      }
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => io.observe(s));

  burger.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    menu.classList.toggle("is-open");
  });
  links.forEach((a) =>
    a.addEventListener("click", () => {
      burger.classList.remove("is-open");
      menu.classList.remove("is-open");
    })
  );
})();
