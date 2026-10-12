import { root, analytics } from "./shared.js";
import { initTracking } from "./tracking.js";
import { initTabAttention } from "./tab-attention.js";
import { initHeader } from "./header.js";
import { initHero } from "./hero.js";
import { initDecisionProof } from "./decision-proof.js";
import { initOfferCountdown } from "./offer-countdown.js";
import { initPriceAnchor } from "./price-anchor.js";
import { initStickyMobile } from "./sticky-mobile.js";
import { initPurchaseBox } from "./purchase-box.js";
import { initVsl } from "./vsl.js";
import { initFaq } from "./faq.js";
import { initPriceReel } from "./price-reel.js";

// One bootstrap per document, including repeated loading of the classic bundle.
const bootstrapKey = Symbol.for("ltf.landing.bootstrapped");

export function initApp() {
  if (window[bootstrapKey]) return;
  window[bootstrapKey] = true;
  root.classList.add("js");
  initTracking();
  initTabAttention();
  initHeader();
  initHero();
  initDecisionProof();
  initOfferCountdown();
  initPriceAnchor();
  initStickyMobile();
  initPurchaseBox();
  initVsl();
  initFaq();
  initPriceReel();
  analytics.pageView();
}

initApp();
