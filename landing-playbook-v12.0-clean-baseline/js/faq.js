let initialized = false;

import { prefersReducedMotion } from "./shared.js";

export function initFaq() {
  if (initialized) return;
  initialized = true;
  /* ---------------- FAQ motion ----------------
     Mantiene <details>/<summary> por accesibilidad y mejora la transición
     con Web Animations API cuando el usuario no pide reduced motion. */
  function initFaqMotion() {
    const items = [...document.querySelectorAll(".purchase-faq details")];
    if (
      !items.length ||
      prefersReducedMotion ||
      typeof Element.prototype.animate !== "function"
    )
      return;

    items.forEach((details) => {
      const summary = details.querySelector("summary");
      const answer = details.querySelector(".faq-answer");
      if (!summary || !answer) return;

      let animation = null;
      let isClosing = false;
      let isExpanding = false;

      const cleanup = () => {
        answer.style.height = "";
        answer.style.opacity = "";
        details.classList.remove("is-closing");
        isClosing = false;
        isExpanding = false;
        animation = null;
      };

      const cancelCurrent = () => {
        if (!animation) return;
        animation.onfinish = null;
        animation.oncancel = null;
        animation.cancel();
        animation = null;
        isClosing = false;
        isExpanding = false;
        details.classList.remove("is-closing");
      };

      const close = () => {
        const startHeight = `${answer.getBoundingClientRect().height}px`;
        cancelCurrent();
        answer.style.height = startHeight;
        answer.style.opacity = "1";
        isClosing = true;
        details.classList.add("is-closing");

        animation = answer.animate(
          [
            { height: startHeight, opacity: 1 },
            { height: "0px", opacity: 0 },
          ],
          {
            duration: 190,
            easing: "cubic-bezier(.4,0,.2,1)",
          },
        );

        animation.onfinish = () => {
          details.open = false;
          cleanup();
        };
        animation.oncancel = cleanup;
      };

      const open = () => {
        const startHeight = details.open
          ? answer.getBoundingClientRect().height
          : 0;
        cancelCurrent();
        isExpanding = true;
        details.open = true;

        answer.style.height = "auto";
        const endHeight = `${answer.getBoundingClientRect().height}px`;
        answer.style.height = `${startHeight}px`;
        answer.style.opacity = startHeight > 0 ? "1" : "0";

        animation = answer.animate(
          [
            { height: `${startHeight}px`, opacity: startHeight > 0 ? 1 : 0 },
            { height: endHeight, opacity: 1 },
          ],
          {
            duration: 230,
            easing: "cubic-bezier(.16,1,.3,1)",
          },
        );

        animation.onfinish = cleanup;
        animation.oncancel = cleanup;
      };

      const settle = () => {
        if (!animation) return;
        const shouldRemainOpen = !isClosing;
        cancelCurrent();
        details.open = shouldRemainOpen;
        cleanup();
      };
      window.addEventListener("pagehide", settle);
      window.addEventListener("resize", settle);

      summary.addEventListener("click", (event) => {
        event.preventDefault();
        if (isClosing || (!details.open && !isExpanding)) {
          open();
        } else if (isExpanding || details.open) {
          close();
        }
      });
    });
  }

  initFaqMotion();
}
