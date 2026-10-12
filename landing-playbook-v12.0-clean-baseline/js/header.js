let initialized = false;

import { body } from "./shared.js";

export function initHeader() {
  if (initialized) return;
  initialized = true;
  /* ---------------- Mobile menu ---------------- */
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  function setMenu(open) {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    mobileMenu.hidden = !open;
    body.classList.toggle("menu-open", open);
    header?.classList.remove("is-hidden");
  }

  menuToggle?.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu
    ?.querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", () => setMenu(false)));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  /* ---------------- Header Liquid Glass no sticky ----------------
     El header conserva el mismo acabado visual, pero forma parte del flujo
     normal de la página y desaparece naturalmente al hacer scroll. */
  header?.classList.remove("is-scrolled", "is-hidden");
}
