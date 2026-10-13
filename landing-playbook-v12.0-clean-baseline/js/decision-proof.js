let initialized = false;

import { prefersReducedMotion } from "./shared.js";

export function initDecisionProof() {
  if (initialized) return;
  initialized = true;
  /* ---------------- Scroll reveals ---------------- */
  const revealNodes = [...document.querySelectorAll("[data-reveal]")];
  revealNodes.forEach((node) => {
    const delay = Number.parseFloat(node.dataset.delay || "0");
    node.style.setProperty(
      "--reveal-delay",
      `${Number.isFinite(delay) ? delay : 0}ms`,
    );
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px 48px 0px", threshold: 0 },
    );

    revealNodes.forEach((node) => revealObserver.observe(node));
  }

  /* ---------------- Animated marker highlights ---------------- */
  const highlightNodes = [...document.querySelectorAll("[data-highlight]")];

  highlightNodes.forEach((node) => {
    const delay = Number.parseFloat(node.dataset.highlightDelay || "0");
    node.style.setProperty(
      "--highlight-delay",
      `${Number.isFinite(delay) ? delay : 0}ms`,
    );
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    highlightNodes.forEach((node) => node.classList.add("is-highlighted"));
  } else {
    const highlightObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-highlighted");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.38 },
    );

    highlightNodes.forEach((node) => highlightObserver.observe(node));
  }
}
