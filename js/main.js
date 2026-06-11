/* ============================================================
   Javian Sandino — Portfolio interactions
   ============================================================ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===== Hero dot grid =====
   A precise grid of ink dots; the pointer magnetizes nearby dots,
   pulling them slightly and flipping them to blue. */
(function dotGrid() {
  const canvas = document.getElementById("gridCanvas");
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  const GAP = 44;
  const RADIUS = 1.4;
  const PULL = 90; // pointer influence radius
  let width, height, dots;
  const pointer = { x: -9999, y: -9999 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    dots = [];
    for (let x = GAP / 2; x < width; x += GAP) {
      for (let y = GAP / 2; y < height; y += GAP) {
        dots.push({ x, y });
      }
    }
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    for (const d of dots) {
      const dx = pointer.x - d.x;
      const dy = pointer.y - d.y;
      const dist = Math.hypot(dx, dy);
      const influence = Math.max(0, 1 - dist / PULL);

      let x = d.x, y = d.y;
      if (influence > 0) {
        x += dx * influence * 0.22;
        y += dy * influence * 0.22;
        ctx.fillStyle = "#1d2bff";
      } else {
        ctx.fillStyle = "rgba(12, 12, 12, 0.22)";
      }

      ctx.beginPath();
      ctx.arc(x, y, RADIUS + influence * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
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
  const nums = document.querySelectorAll("[data-count]");
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
