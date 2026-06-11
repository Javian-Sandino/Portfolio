/* ============================================================
   Javian Sandino — Portfolio
   Neuro journey: Lenis smooth scroll + GSAP ScrollTrigger,
   plus the neural-network hero canvas. Everything degrades to
   a static page when the CDNs fail or the visitor prefers
   reduced motion.
   ============================================================ */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

if (hasGsap) gsap.registerPlugin(ScrollTrigger);

/* ===== Neural network hero canvas =====
   Drifting nodes connected by proximity; the pointer acts as a
   stimulus that brightens nearby synapses. */
(function neuralCanvas() {
  const canvas = document.getElementById("neuralCanvas");
  if (!canvas || reducedMotion) return;

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

/* ===== smooth scroll (Lenis driving ScrollTrigger) ===== */
if (!reducedMotion && hasGsap && typeof Lenis !== "undefined") {
  const lenis = new Lenis({ lerp: 0.12 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links route through Lenis so pinned sections are handled
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0 });
    });
  });
}

/* ===== split manifesto into words ===== */
(function splitManifesto() {
  const el = document.getElementById("manifestoText");
  if (!el) return;
  const wrap = (node) => {
    const words = node.textContent.split(/\s+/).filter(Boolean);
    const frag = document.createDocumentFragment();
    words.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = w;
      frag.appendChild(span);
      if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
    });
    return frag;
  };
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      el.replaceChild(wrap(node), node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.classList.add("word"); // accent <em> behaves as one word
    }
  });
})();

/* ===== scroll choreography ===== */
if (hasGsap && !reducedMotion) {
  /* hero entrance */
  gsap.from("[data-line]", {
    yPercent: 120,
    duration: 1.1,
    ease: "power4.out",
    stagger: 0.12,
    delay: 0.15,
  });
  gsap.from(".hero__block", { scaleY: 0, transformOrigin: "bottom", duration: 0.9, ease: "power3.inOut", delay: 0.6 });

  /* progress bar */
  gsap.to("#progressBar", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
  });

  /* desktop-only choreography — re-evaluated whenever the viewport
     crosses the breakpoint, so a resize can't strand the page */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 721px)", () => {
    /* hero exit: name splits apart as you scroll, hint fades */
    gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: true },
    })
      .to(".hero__line:nth-child(1) .hero__line-inner", { xPercent: -16, ease: "none" }, 0)
      .to(".hero__line:nth-child(2) .hero__line-inner", { xPercent: 16, ease: "none" }, 0)
      .to(".hero__baseline, .hero__block", { autoAlpha: 0, y: -40, ease: "none" }, 0)
      .to("#scrollHint", { autoAlpha: 0, ease: "none" }, 0);

    /* manifesto: words ignite one by one while pinned */
    gsap.to(".manifesto__text .word", {
      opacity: 1,
      stagger: 0.6,
      ease: "none",
      scrollTrigger: {
        trigger: ".manifesto",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
      },
    });

    /* horizontal projects */
    const track = document.getElementById("buildTrack");
    if (track) {
      const distance = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: ".build",
          start: "top top",
          end: () => "+=" + distance(),
          pin: ".build__sticky",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
    }
  });

  /* generic reveals */
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 44,
      autoAlpha: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });
} else {
  // static fallback: ensure nothing is left hidden
  document.querySelectorAll(".manifesto__text .word").forEach((w) => (w.style.opacity = 1));
}

/* ===== count-up stats ===== */
(function countUp() {
  const nums = document.querySelectorAll(".stat__num[data-count]");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        if (reducedMotion) { el.textContent = target; return; }
        const start = performance.now();
        const dur = 1300;
        (function tick(now) {
          const p = Math.min(1, (now - start) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    },
    { threshold: 0.6 }
  );
  nums.forEach((el) => io.observe(el));
})();

/* ===== chapter rail: active state ===== */
(function rail() {
  const rail = document.getElementById("rail");
  if (!rail) return;
  const links = rail.querySelectorAll("a");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((a) => a.classList.toggle("is-active", a.dataset.chapter === id));
      });
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  ["hero", "signal", "decode", "build", "offclock", "contact"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
})();

/* ===== custom cursor ===== */
(function cursor() {
  if (!window.matchMedia("(pointer: fine)").matches || reducedMotion) return;
  const dot = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;
  document.body.classList.add("cursor-active");

  let rx = innerWidth / 2, ry = innerHeight / 2;
  let tx = rx, ty = ry;

  addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY;
    dot.style.left = tx + "px";
    dot.style.top = ty + "px";
  });

  (function follow() {
    rx += (tx - rx) * 0.16;
    ry += (ty - ry) * 0.16;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(follow);
  })();

  document.querySelectorAll("[data-hover], a").forEach((el) => {
    el.addEventListener("pointerenter", () => ring.classList.add("is-hover"));
    el.addEventListener("pointerleave", () => ring.classList.remove("is-hover"));
  });
})();
