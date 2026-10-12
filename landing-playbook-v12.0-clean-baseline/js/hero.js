let initialized = false;

import { root, prefersReducedMotion } from "./shared.js";

export function initHero() {
  if (initialized) return;
  initialized = true;
  /* ---------------- Hero stagger ---------------- */
  const heroItems = [...document.querySelectorAll("[data-hero-item]")];
  heroItems.forEach((node, index) =>
    node.style.setProperty("--hero-index", index),
  );

  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.add("is-ready"));
  });

  /* ---------------- Hero dot field ----------------
     Adaptación ligera del comportamiento visual de la referencia:
     - malla adaptativa
     - morph suave con el cursor en desktop
     - densidad reducida en mobile
     - ~30fps para contener costo de render
  */
  const canvas = document.querySelector("[data-hero-dots]");
  const hero = canvas?.closest(".hero");

  if (canvas && hero && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d", { alpha: true });
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const state = {
      width: 0,
      height: 0,
      dpr: 1,
      targetX: 0.5,
      targetY: 0.5,
      pointerX: 0.5,
      pointerY: 0.5,
      targetActive: 0,
      pointerActive: 0,
      visible: true,
    };

    let lastFrame = 0;
    let raf = 0;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    function resizeCanvas() {
      const rect = hero.getBoundingClientRect();
      state.width = Math.max(1, Math.round(rect.width));
      state.height = Math.max(1, Math.round(rect.height));
      state.dpr =
        window.innerWidth < 768
          ? 1
          : Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    }

    function drawDots(time) {
      raf = requestAnimationFrame(drawDots);
      if (!state.visible || time - lastFrame < 33) return;
      lastFrame = time;

      const w = state.width;
      const h = state.height;
      if (!w || !h) return;

      state.pointerX += (state.targetX - state.pointerX) * 0.075;
      state.pointerY += (state.targetY - state.pointerY) * 0.075;
      state.pointerActive += (state.targetActive - state.pointerActive) * 0.08;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      const mobile = w < 768;
      const gap = mobile ? 13.8 : clamp(w / 138, 10.2, 13.4);
      const startY = h * 0.245;
      const endY = h * 0.81;
      const t = time * 0.00034;

      for (let y = startY; y <= endY; y += gap) {
        const ny = y / h;
        const envelopeY = Math.sin(Math.PI * clamp((ny - 0.19) / 0.66, 0, 1));

        for (let x = 0; x <= w; x += gap) {
          const nx = x / w;

          /* Dos crestas suaves + modulación lenta: menos banda uniforme, más "imagen" atmosférica. */
          const flowA =
            Math.sin(nx * 7.4 + t * 1.45) * 0.42 +
            Math.cos(ny * 8.8 - t * 0.86) * 0.26 +
            Math.sin((nx + ny) * 10.8 + t * 0.74) * 0.18;
          const flowB =
            Math.cos(nx * 5.1 - t * 1.12) * 0.22 +
            Math.sin(ny * 12.4 + t * 0.62) * 0.14;

          const centerA = 0.535 + flowA * 0.105;
          const centerB = 0.59 + flowB * 0.145;
          const ridgeA = Math.exp(-Math.pow(ny - centerA, 2) / 0.016);
          const ridgeB = Math.exp(-Math.pow(ny - centerB, 2) / 0.038) * 0.42;

          const spatialFade =
            0.62 +
            0.22 * Math.sin(nx * Math.PI * 1.7 + 0.5) +
            0.16 * Math.cos((nx + ny) * Math.PI * 2.2);

          const base = Math.max(
            0,
            (ridgeA + ridgeB) * envelopeY * clamp(spatialFade, 0.25, 1),
          );
          if (base < 0.13) continue;

          let morph = 0;
          if (!coarsePointer && state.pointerActive > 0.01) {
            const dx = (nx - state.pointerX) * (w / h);
            const dy = ny - state.pointerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const irregular =
              Math.sin(nx * 31 + t * 2.2) * 0.012 +
              Math.cos(ny * 27 - t * 1.55) * 0.01;
            morph =
              clamp(1 - dist / (0.12 + irregular), 0, 1) * state.pointerActive;
          }

          const strength = clamp(base * 0.82 + morph * 0.26, 0, 1);
          const size =
            (0.32 + strength * 0.88 + morph * 0.34) * (mobile ? 0.88 : 1);
          const alpha = 0.018 + strength * 0.22 + morph * 0.035;

          const violetMix = clamp(
            0.16 + nx * 0.64 + Math.sin(ny * 5.5) * 0.08,
            0,
            1,
          );
          const r = Math.round(30 + (78 - 30) * violetMix);
          const g = Math.round(57 + (35 - 57) * violetMix);
          const b = Math.round(175 + (226 - 175) * violetMix);

          /* Halo mínimo; perceptible como profundidad, no como glow evidente. */
          if (strength > 0.48) {
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.11})`;
            ctx.beginPath();
            ctx.arc(x, y, size * 2.75, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (!coarsePointer) {
      hero.addEventListener(
        "pointermove",
        (event) => {
          const rect = hero.getBoundingClientRect();
          state.targetX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
          state.targetY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
          state.targetActive = 1;
        },
        { passive: true },
      );

      hero.addEventListener(
        "pointerleave",
        () => {
          state.targetActive = 0;
        },
        { passive: true },
      );
    }

    if ("IntersectionObserver" in window) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          state.visible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0 },
      );
      heroObserver.observe(hero);
    }

    if ("ResizeObserver" in window) {
      new ResizeObserver(resizeCanvas).observe(hero);
    } else {
      window.addEventListener("resize", resizeCanvas, { passive: true });
    }

    document.addEventListener("visibilitychange", () => {
      state.visible =
        !document.hidden && hero.getBoundingClientRect().bottom > 0;
    });

    resizeCanvas();
    raf = requestAnimationFrame(drawDots);
    window.addEventListener("pagehide", () => {
      cancelAnimationFrame(raf);
      raf = 0;
    });
    window.addEventListener("pageshow", () => {
      if (!raf) {
        resizeCanvas();
        raf = requestAnimationFrame(drawDots);
      }
    });
  }
}
