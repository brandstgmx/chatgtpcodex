let initialized = false;

import { CONFIG, analytics } from "./shared.js";

export function initPurchaseBox() {
  if (initialized) return;
  initialized = true;
  /* ---------------- Payhip ---------------- */
  const checkoutUrl =
    typeof CONFIG.payhipCheckoutUrl === "string"
      ? CONFIG.payhipCheckoutUrl.trim()
      : "";

  document.querySelectorAll("[data-checkout-link]").forEach((link) => {
    if (checkoutUrl) {
      link.href = checkoutUrl;
      link.rel = "noopener";
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-checkout-link], [data-track-cta]");
    if (!link) return;
    const location = link.dataset.ctaLocation || "unknown";
    analytics.ctaClick(location);
    if (!link.hasAttribute("data-checkout-link")) return;
    if (checkoutUrl) analytics.checkoutStart(location);
    else if (location === "offer") event.preventDefault();
  });

  /* ---------------- Métodos de pago ----------------
     Los logos se renderizan como SVG inline/local para evitar dependencias remotas.
     CONFIG.paymentMethods decide cuáles se muestran.
  */
  const paymentMethods = Array.isArray(CONFIG.paymentMethods)
    ? CONFIG.paymentMethods
        .map((method) => String(method).trim().toLowerCase())
        .filter(Boolean)
    : [];
  const paymentContainer = document.querySelector("[data-payment-methods]");

  if (paymentContainer) {
    const badges = [
      ...paymentContainer.querySelectorAll("[data-payment-method]"),
    ];
    const enabled = new Set(paymentMethods);

    badges.forEach((badge) => {
      const key = String(badge.dataset.paymentMethod || "").toLowerCase();
      badge.hidden = enabled.size > 0 && !enabled.has(key);
    });

    paymentContainer.hidden = !badges.some((badge) => !badge.hidden);
  }
}
