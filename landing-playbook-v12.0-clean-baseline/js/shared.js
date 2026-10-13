export const CONFIG = {
  payhipCheckoutUrl: "",
  bunnyStreamEmbedUrl: "",
  paymentMethods: [
    "apple-pay",
    "google-pay",
    "visa",
    "mastercard",
    "amex",
    "carnet",
  ], // Elimina aquí cualquier método que no aparezca en el checkout final
  product: {
    name: "¿Me conviene franquiciar mi negocio o seguir yo solo?",
    value: 349,
    currency: "MXN",
  },
};

export const root = document.documentElement;
export const body = document.body;
export const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* ---------------- Analytics helpers ---------------- */
function pushEvent(event, params = {}) {
  const payload = { event, ...params };

  if (window.LTFTracking) window.LTFTracking.track(event, params);
  else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }
}

export const analytics = {
  pageView() {
    pushEvent("page_view", { page_type: "product_landing" });
  },
  videoStart() {
    pushEvent("video_start", { video: "sales_video" });
  },
  videoComplete() {
    pushEvent("video_complete", { video: "sales_video" });
  },
  ctaClick(location) {
    pushEvent("cta_click", { location });
  },
  checkoutStart(location) {
    pushEvent("checkout_start", {
      location,
      currency: CONFIG.product.currency,
      value: CONFIG.product.value,
      item_name: CONFIG.product.name,
    });
  },
};

/* Hook para una página de gracias / callback de compra. */
window.LTFTrackPurchase = function LTFTrackPurchase(transactionId = "") {
  pushEvent("purchase", {
    transaction_id: transactionId,
    currency: CONFIG.product.currency,
    value: CONFIG.product.value,
    item_name: CONFIG.product.name,
  });
};
