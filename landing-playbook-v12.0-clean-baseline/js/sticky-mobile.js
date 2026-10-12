let initialized = false;

export function initStickyMobile() {
  if (initialized) return;
  initialized = true;
  const mobileOfferBar = document.querySelector("[data-mobile-offer-bar]");
  const purchasePanel = document.querySelector("[data-offer-panel]");
  const siteFooter = document.querySelector(".site-footer");
  const header = document.querySelector("[data-header]");
  /* ---------------- Sticky mobile: simple, robust, no footer docking ----------------
     Reglas:
     - Mobile <= 640px.
     - Aparece después de que sale el header.
     - Se oculta al acercarse/atravesar el box de compra.
     - Se oculta cuando aparece el footer.
     - NUNCA cambia su propiedad bottom según el footer.
       Esto evita cualquier feedback de geometría/scroll.
  */
  const MOBILE_STICKY_GAP = 18;
  let mobileOfferBarFrame = null;

  function isMobileOfferViewport() {
    return window.matchMedia("(max-width: 640px)").matches;
  }

  function hasHeaderClearedViewport() {
    const pageHeader = header || document.querySelector("[data-header]");
    if (!pageHeader) return window.scrollY > 80;
    return pageHeader.getBoundingClientRect().bottom <= 0;
  }

  function getMobileOfferVisualHeight() {
    if (!mobileOfferBar) return 0;
    const inner = mobileOfferBar.querySelector(".mobile-offer-bar__inner");
    const capsule = mobileOfferBar.querySelector(".mobile-offer-bar__capsule");

    if (!inner)
      return Math.max(0, mobileOfferBar.getBoundingClientRect().height);

    const innerRect = inner.getBoundingClientRect();
    if (!capsule) return Math.max(0, innerRect.height);

    const capsuleRect = capsule.getBoundingClientRect();
    return Math.max(innerRect.height, innerRect.bottom - capsuleRect.top);
  }

  function isPurchasePanelInStickyCollisionZone() {
    if (!purchasePanel || !mobileOfferBar || !isMobileOfferViewport())
      return false;

    const rect = purchasePanel.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const stickyHeight = getMobileOfferVisualHeight();
    const collisionLine = viewportHeight - stickyHeight - MOBILE_STICKY_GAP;

    return rect.top <= collisionLine && rect.bottom >= MOBILE_STICKY_GAP;
  }

  function isFooterVisible() {
    if (!siteFooter || !isMobileOfferViewport()) return false;

    const rect = siteFooter.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    return rect.top < viewportHeight && rect.bottom > 0;
  }

  function shouldShowMobileOfferBar() {
    if (!mobileOfferBar || !isMobileOfferViewport()) return false;
    if (!hasHeaderClearedViewport()) return false;
    if (isPurchasePanelInStickyCollisionZone()) return false;
    if (isFooterVisible()) return false;
    return true;
  }

  function updateMobileOfferBarVisibility() {
    if (!mobileOfferBar) return;

    const shouldShow = shouldShowMobileOfferBar();
    const purchaseCollision = isPurchasePanelInStickyCollisionZone();

    mobileOfferBar.classList.toggle("is-visible", shouldShow);
    mobileOfferBar.classList.toggle(
      "is-paused-for-purchase",
      purchaseCollision,
    );
    mobileOfferBar.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  }

  function scheduleMobileOfferBarVisibilityUpdate() {
    if (mobileOfferBarFrame !== null) return;

    mobileOfferBarFrame = window.requestAnimationFrame(() => {
      mobileOfferBarFrame = null;
      updateMobileOfferBarVisibility();
    });
  }

  window.addEventListener("scroll", scheduleMobileOfferBarVisibilityUpdate, {
    passive: true,
  });
  window.addEventListener("resize", scheduleMobileOfferBarVisibilityUpdate);
  window.addEventListener(
    "orientationchange",
    scheduleMobileOfferBarVisibilityUpdate,
  );
  window.addEventListener("pageshow", scheduleMobileOfferBarVisibilityUpdate);
  updateMobileOfferBarVisibility();
}
