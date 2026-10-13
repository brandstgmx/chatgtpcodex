/* Generated from js/bootstrap.js. Rebuild with: cd qa && npm run build */
(() => {
  // js/shared.js
  var CONFIG = {
    payhipCheckoutUrl: "",
    bunnyStreamEmbedUrl: "",
    paymentMethods: [
      "apple-pay",
      "google-pay",
      "visa",
      "mastercard",
      "amex",
      "carnet"
    ],
    // Elimina aquí cualquier método que no aparezca en el checkout final
    product: {
      name: "\xBFMe conviene franquiciar mi negocio o seguir yo solo?",
      value: 349,
      currency: "MXN"
    }
  };
  var root = document.documentElement;
  var body = document.body;
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  function pushEvent(event, params = {}) {
    const payload = { event, ...params };
    if (window.LTFTracking) window.LTFTracking.track(event, params);
    else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
    }
  }
  var analytics = {
    pageView() {
      pushEvent("page_view", { page_type: "product_landing" });
    },
    videoStart() {
      pushEvent("video_start", { video: "sales_video" });
    },
    videoComplete() {
      pushEvent("video_complete", { video: "sales_video" });
    },
    ctaClick(location2) {
      pushEvent("cta_click", { location: location2 });
    },
    checkoutStart(location2) {
      pushEvent("checkout_start", {
        location: location2,
        currency: CONFIG.product.currency,
        value: CONFIG.product.value,
        item_name: CONFIG.product.name
      });
    }
  };
  window.LTFTrackPurchase = function LTFTrackPurchase(transactionId = "") {
    pushEvent("purchase", {
      transaction_id: transactionId,
      currency: CONFIG.product.currency,
      value: CONFIG.product.value,
      item_name: CONFIG.product.name
    });
  };

  // js/tracking.js
  var initialized = false;
  function initTracking() {
    if (initialized) return;
    initialized = true;
    const TRACKING_CONFIG = {
      metaPixelId: "",
      tiktokPixelId: "",
      consentGranted: false,
      debug: false
    };
    const state = {
      metaLoaded: false,
      tiktokLoaded: false
    };
    const log = (...args) => {
      if (TRACKING_CONFIG.debug) console.info("[LTFTracking]", ...args);
    };
    function loadMetaPixel() {
      if (state.metaLoaded || !TRACKING_CONFIG.metaPixelId) return;
      !(function(f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(
        window,
        document,
        "script",
        "https://connect.facebook.net/en_US/fbevents.js"
      );
      fbq("init", TRACKING_CONFIG.metaPixelId);
      fbq("track", "PageView");
      state.metaLoaded = true;
      log("Meta Pixel loaded");
    }
    function loadTikTokPixel() {
      if (state.tiktokLoaded || !TRACKING_CONFIG.tiktokPixelId) return;
      !(function(w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = [
          "page",
          "track",
          "identify",
          "instances",
          "debug",
          "on",
          "off",
          "once",
          "ready",
          "alias",
          "group",
          "enableCookie",
          "disableCookie",
          "holdConsent",
          "revokeConsent",
          "grantConsent"
        ];
        ttq.setAndDefer = function(t2, e) {
          t2[e] = function() {
            t2.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (var i = 0; i < ttq.methods.length; i++)
          ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function(t2) {
          for (var e = ttq._i[t2] || [], n = 0; n < ttq.methods.length; n++)
            ttq.setAndDefer(e, ttq.methods[n]);
          return e;
        };
        ttq.load = function(e, n) {
          var r = "https://analytics.tiktok.com/i18n/pixel/events.js", o = n && n.partner;
          ttq._i = ttq._i || {};
          ttq._i[e] = [];
          ttq._i[e]._u = r;
          ttq._t = ttq._t || {};
          ttq._t[e] = +/* @__PURE__ */ new Date();
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          var a = document.createElement("script");
          a.type = "text/javascript";
          a.async = true;
          a.src = r + "?sdkid=" + e + "&lib=" + t;
          var s = document.getElementsByTagName("script")[0];
          s.parentNode.insertBefore(a, s);
        };
        ttq.load(TRACKING_CONFIG.tiktokPixelId);
        ttq.page();
      })(window, document, "ttq");
      state.tiktokLoaded = true;
      log("TikTok Pixel loaded");
    }
    function loadAdvertisingPixels() {
      if (!TRACKING_CONFIG.consentGranted) return;
      loadMetaPixel();
      loadTikTokPixel();
    }
    function track(eventName, params = {}) {
      log(eventName, params);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: eventName, ...params });
      if (state.metaLoaded && window.fbq) {
        const metaMap = {
          CTA_Click: "ViewContent",
          cta_click: "ViewContent",
          page_view: "PageView",
          video_start: "ViewContent",
          video_complete: "ViewContent",
          checkout_start: "InitiateCheckout",
          purchase: "Purchase",
          CheckoutStart: "InitiateCheckout",
          Purchase: "Purchase",
          VideoStart: "ViewContent",
          VideoComplete: "ViewContent"
        };
        const mapped = metaMap[eventName];
        if (mapped) window.fbq("track", mapped, params);
      }
      if (state.tiktokLoaded && window.ttq) {
        const ttMap = {
          CTA_Click: "ViewContent",
          cta_click: "ViewContent",
          video_start: "ViewContent",
          video_complete: "ViewContent",
          checkout_start: "InitiateCheckout",
          purchase: "CompletePayment",
          CheckoutStart: "InitiateCheckout",
          Purchase: "CompletePayment",
          VideoStart: "ViewContent",
          VideoComplete: "ViewContent"
        };
        const mapped = ttMap[eventName];
        if (mapped) window.ttq.track(mapped, params);
      }
    }
    function grantAdvertisingConsent() {
      TRACKING_CONFIG.consentGranted = true;
      loadAdvertisingPixels();
      if (window.ttq && window.ttq.grantConsent) window.ttq.grantConsent();
    }
    function revokeAdvertisingConsent() {
      TRACKING_CONFIG.consentGranted = false;
      if (window.ttq && window.ttq.revokeConsent) window.ttq.revokeConsent();
    }
    window.LTFTracking = {
      config: TRACKING_CONFIG,
      track,
      grantAdvertisingConsent,
      revokeAdvertisingConsent,
      loadAdvertisingPixels
    };
    loadAdvertisingPixels();
  }

  // js/tab-attention.js
  var initialized2 = false;
  function initTabAttention() {
    if (initialized2) return;
    initialized2 = true;
    const CONFIG2 = {
      enabled: true,
      minimumDwellMs: 8e3,
      intervalMs: 1500,
      messages: ["\u{1F440} Espera\u2026 antes de irte", "\u{1F4D8} Tu Playbook te espera"]
    };
    const originalTitle = document.title;
    const loadedAt = performance.now();
    let timer = null;
    let index = 0;
    let eligible = false;
    let eligibilityTimer = null;
    function restoreTitle() {
      document.title = originalTitle;
    }
    function stopAttention() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
      index = 0;
      restoreTitle();
    }
    function startAttention() {
      if (!CONFIG2.enabled || !eligible || !document.hidden || timer !== null)
        return;
      index = 0;
      document.title = CONFIG2.messages[index];
      timer = window.setInterval(() => {
        index = (index + 1) % CONFIG2.messages.length;
        document.title = CONFIG2.messages[index];
      }, CONFIG2.intervalMs);
    }
    function updateEligibility() {
      if (eligibilityTimer !== null) {
        clearTimeout(eligibilityTimer);
        eligibilityTimer = null;
      }
      const elapsed = performance.now() - loadedAt;
      if (elapsed >= CONFIG2.minimumDwellMs) {
        eligible = true;
        if (document.hidden) startAttention();
        return;
      }
      const remaining = Math.max(0, CONFIG2.minimumDwellMs - elapsed);
      eligibilityTimer = window.setTimeout(() => {
        eligible = true;
        eligibilityTimer = null;
        if (document.hidden) startAttention();
      }, remaining);
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        startAttention();
      } else {
        stopAttention();
      }
    });
    window.addEventListener("pagehide", () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    });
    window.addEventListener("pageshow", () => {
      restoreTitle();
      if (!eligible) updateEligibility();
    });
    window.addEventListener("beforeunload", () => {
      if (eligibilityTimer !== null) {
        window.clearTimeout(eligibilityTimer);
      }
      stopAttention();
    });
    window.LTFTabAttention = {
      config: CONFIG2,
      enable() {
        CONFIG2.enabled = true;
        if (!eligible) updateEligibility();
        if (document.hidden) startAttention();
      },
      disable() {
        CONFIG2.enabled = false;
        stopAttention();
      },
      test() {
        eligible = true;
        startAttention();
      },
      restore() {
        stopAttention();
      }
    };
    updateEligibility();
  }

  // js/header.js
  var initialized3 = false;
  function initHeader() {
    if (initialized3) return;
    initialized3 = true;
    const header = document.querySelector("[data-header]");
    const menuToggle = document.querySelector("[data-menu-toggle]");
    const mobileMenu = document.querySelector("[data-mobile-menu]");
    function setMenu(open) {
      if (!menuToggle || !mobileMenu) return;
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Cerrar men\xFA" : "Abrir men\xFA");
      mobileMenu.hidden = !open;
      body.classList.toggle("menu-open", open);
      header?.classList.remove("is-hidden");
    }
    menuToggle?.addEventListener("click", () => {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });
    mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenu(false);
    });
    header?.classList.remove("is-scrolled", "is-hidden");
  }

  // js/hero.js
  var initialized4 = false;
  function initHero() {
    if (initialized4) return;
    initialized4 = true;
    const heroItems = [...document.querySelectorAll("[data-hero-item]")];
    heroItems.forEach(
      (node, index) => node.style.setProperty("--hero-index", index)
    );
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.add("is-ready"));
    });
    const canvas = document.querySelector("[data-hero-dots]");
    const hero = canvas?.closest(".hero");
    if (canvas && hero && !prefersReducedMotion) {
      let resizeCanvas = function() {
        const rect = hero.getBoundingClientRect();
        state.width = Math.max(1, Math.round(rect.width));
        state.height = Math.max(1, Math.round(rect.height));
        state.dpr = window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(state.width * state.dpr);
        canvas.height = Math.round(state.height * state.dpr);
        canvas.style.width = `${state.width}px`;
        canvas.style.height = `${state.height}px`;
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      }, drawDots = function(time) {
        raf = 0;
        if (!state.visible || document.hidden) return;
        raf = requestAnimationFrame(drawDots);
        if (time - lastFrame < 33) return;
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
        const t = time * 34e-5;
        for (let y = startY; y <= endY; y += gap) {
          const ny = y / h;
          const envelopeY = Math.sin(Math.PI * clamp((ny - 0.19) / 0.66, 0, 1));
          for (let x = 0; x <= w; x += gap) {
            const nx = x / w;
            const flowA = Math.sin(nx * 7.4 + t * 1.45) * 0.42 + Math.cos(ny * 8.8 - t * 0.86) * 0.26 + Math.sin((nx + ny) * 10.8 + t * 0.74) * 0.18;
            const flowB = Math.cos(nx * 5.1 - t * 1.12) * 0.22 + Math.sin(ny * 12.4 + t * 0.62) * 0.14;
            const centerA = 0.535 + flowA * 0.105;
            const centerB = 0.59 + flowB * 0.145;
            const ridgeA = Math.exp(-Math.pow(ny - centerA, 2) / 0.016);
            const ridgeB = Math.exp(-Math.pow(ny - centerB, 2) / 0.038) * 0.42;
            const spatialFade = 0.62 + 0.22 * Math.sin(nx * Math.PI * 1.7 + 0.5) + 0.16 * Math.cos((nx + ny) * Math.PI * 2.2);
            const base = Math.max(
              0,
              (ridgeA + ridgeB) * envelopeY * clamp(spatialFade, 0.25, 1)
            );
            if (base < 0.13) continue;
            let morph = 0;
            if (!coarsePointer && state.pointerActive > 0.01) {
              const dx = (nx - state.pointerX) * (w / h);
              const dy = ny - state.pointerY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const irregular = Math.sin(nx * 31 + t * 2.2) * 0.012 + Math.cos(ny * 27 - t * 1.55) * 0.01;
              morph = clamp(1 - dist / (0.12 + irregular), 0, 1) * state.pointerActive;
            }
            const strength = clamp(base * 0.82 + morph * 0.26, 0, 1);
            const size = (0.32 + strength * 0.88 + morph * 0.34) * (mobile ? 0.88 : 1);
            const alpha = 0.018 + strength * 0.22 + morph * 0.035;
            const violetMix = clamp(
              0.16 + nx * 0.64 + Math.sin(ny * 5.5) * 0.08,
              0,
              1
            );
            const r = Math.round(30 + (78 - 30) * violetMix);
            const g = Math.round(57 + (35 - 57) * violetMix);
            const b = Math.round(175 + (226 - 175) * violetMix);
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
      }, updateCanvasActivity = function() {
        const rect = hero.getBoundingClientRect();
        state.visible = !document.hidden && rect.bottom > 0 && rect.top < window.innerHeight;
        if (state.visible && !raf) raf = requestAnimationFrame(drawDots);
        else if (!state.visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      };
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;
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
        visible: true
      };
      let lastFrame = 0;
      let raf = 0;
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      if (!coarsePointer) {
        hero.addEventListener(
          "pointermove",
          (event) => {
            const rect = hero.getBoundingClientRect();
            state.targetX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
            state.targetY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
            state.targetActive = 1;
          },
          { passive: true }
        );
        hero.addEventListener(
          "pointerleave",
          () => {
            state.targetActive = 0;
          },
          { passive: true }
        );
      }
      if ("IntersectionObserver" in window) {
        const heroObserver = new IntersectionObserver(
          (entries) => {
            updateCanvasActivity();
          },
          { threshold: 0 }
        );
        heroObserver.observe(hero);
      } else {
        window.addEventListener("scroll", updateCanvasActivity, {
          passive: true
        });
      }
      if ("ResizeObserver" in window) {
        new ResizeObserver(resizeCanvas).observe(hero);
      } else {
        window.addEventListener("resize", resizeCanvas, { passive: true });
      }
      document.addEventListener("visibilitychange", () => {
        updateCanvasActivity();
      });
      resizeCanvas();
      updateCanvasActivity();
      window.addEventListener("pagehide", () => {
        cancelAnimationFrame(raf);
        raf = 0;
      });
      window.addEventListener("pageshow", () => {
        if (!raf) {
          resizeCanvas();
          updateCanvasActivity();
        }
      });
    }
  }

  // js/decision-proof.js
  var initialized5 = false;
  function initDecisionProof() {
    if (initialized5) return;
    initialized5 = true;
    const revealNodes = [...document.querySelectorAll("[data-reveal]")];
    revealNodes.forEach((node) => {
      const delay = Number.parseFloat(node.dataset.delay || "0");
      node.style.setProperty(
        "--reveal-delay",
        `${Number.isFinite(delay) ? delay : 0}ms`
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
        { rootMargin: "0px 0px 48px 0px", threshold: 0 }
      );
      revealNodes.forEach((node) => revealObserver.observe(node));
    }
    const highlightNodes = [...document.querySelectorAll("[data-highlight]")];
    highlightNodes.forEach((node) => {
      const delay = Number.parseFloat(node.dataset.highlightDelay || "0");
      node.style.setProperty(
        "--highlight-delay",
        `${Number.isFinite(delay) ? delay : 0}ms`
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
        { rootMargin: "0px 0px -10% 0px", threshold: 0.38 }
      );
      highlightNodes.forEach((node) => highlightObserver.observe(node));
    }
  }

  // js/offer-countdown.js
  var initialized6 = false;
  function initOfferCountdown() {
    if (initialized6) return;
    initialized6 = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const OFFER_DURATION_MINUTES = 5;
    const OFFER_STORAGE_KEY = "ltf_offer_expires_at_v5";
    const offerStatus = document.querySelector("[data-offer-status]");
    const offerActive = document.querySelector("[data-offer-active]");
    const offerExpired = document.querySelector("[data-offer-expired]");
    const offerCountdown = document.querySelector("[data-offer-countdown]");
    const offerCountdownPrefix = document.querySelector(
      "[data-offer-countdown-prefix]"
    );
    const offerCountdownSeconds = document.querySelector(
      "[data-offer-countdown-seconds]"
    );
    const mobileOfferActive = document.querySelector(
      "[data-mobile-offer-active]"
    );
    const mobileOfferExpired = document.querySelector(
      "[data-mobile-offer-expired]"
    );
    const mobileOfferCountdown = document.querySelector(
      "[data-mobile-offer-countdown]"
    );
    const mobileOfferPrefix = document.querySelector(
      "[data-mobile-offer-prefix]"
    );
    const mobileOfferSeconds = document.querySelector(
      "[data-mobile-offer-seconds]"
    );
    let offerTimerId = null;
    let offerExpiresAt = null;
    let memoryExpiry = null;
    let previousMobileSecond = null;
    let previousDesktopSecond = null;
    function getPersistentStorage() {
      const candidates = [() => window.localStorage, () => window.sessionStorage];
      for (const getStorage of candidates) {
        try {
          const storage = getStorage();
          const probeKey = `${OFFER_STORAGE_KEY}__probe`;
          storage.setItem(probeKey, "1");
          storage.removeItem(probeKey);
          return storage;
        } catch (error) {
        }
      }
      return null;
    }
    function getOrCreateOfferExpiry() {
      const durationMs = Math.max(0, Number(OFFER_DURATION_MINUTES) || 0) * 60 * 1e3;
      const storage = getPersistentStorage();
      if (storage) {
        let stored = null;
        try {
          stored = storage.getItem(OFFER_STORAGE_KEY);
        } catch {
        }
        if (stored !== null) {
          const parsed = Number(stored);
          if (Number.isFinite(parsed) && parsed > 0) return parsed;
        }
        const expiresAt = Date.now() + durationMs;
        try {
          storage.setItem(OFFER_STORAGE_KEY, String(expiresAt));
          return expiresAt;
        } catch (error) {
        }
      }
      if (!Number.isFinite(memoryExpiry)) {
        memoryExpiry = Date.now() + durationMs;
      }
      return memoryExpiry;
    }
    function stopOfferTimer() {
      if (offerTimerId !== null) {
        window.clearInterval(offerTimerId);
        offerTimerId = null;
      }
    }
    function formatOfferTime(totalSeconds) {
      const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
      const hours = Math.floor(safeSeconds / 3600);
      const minutes = Math.floor(safeSeconds % 3600 / 60);
      const seconds = safeSeconds % 60;
      if (hours > 0) {
        return {
          prefix: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
          seconds: String(seconds).padStart(2, "0"),
          text: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        };
      }
      const totalMinutes = Math.floor(safeSeconds / 60);
      return {
        prefix: String(totalMinutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
        text: `${String(totalMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      };
    }
    function setOfferState(state) {
      const isActive = state === "active";
      if (offerActive && offerExpired) {
        offerActive.hidden = !isActive;
        offerExpired.hidden = isActive;
      }
      if (offerStatus) {
        offerStatus.dataset.offerState = state;
        offerStatus.classList.remove("is-initializing");
      }
      if (mobileOfferActive && mobileOfferExpired) {
        mobileOfferActive.hidden = !isActive;
        mobileOfferExpired.hidden = isActive;
      }
    }
    function renderOfferCountdown() {
      const hasAnyCountdown = Boolean(offerCountdown || mobileOfferCountdown);
      if (!hasAnyCountdown || !offerExpiresAt) {
        setOfferState("expired");
        stopOfferTimer();
        return;
      }
      const remainingMs = offerExpiresAt - Date.now();
      if (remainingMs <= 0) {
        setOfferState("expired");
        stopOfferTimer();
        return;
      }
      const remainingSeconds = remainingMs / 1e3;
      const formatted = formatOfferTime(remainingSeconds);
      if (offerCountdown) {
        if (offerCountdownPrefix && offerCountdownSeconds) {
          offerCountdownPrefix.textContent = formatted.prefix;
          offerCountdownSeconds.textContent = formatted.seconds;
          if (formatted.seconds !== previousDesktopSecond && !reducedMotion.matches) {
            offerCountdownSeconds.classList.remove("is-pulsing");
            void offerCountdownSeconds.offsetWidth;
            offerCountdownSeconds.classList.add("is-pulsing");
          }
          previousDesktopSecond = formatted.seconds;
        } else {
          offerCountdown.textContent = formatted.text;
        }
      }
      if (mobileOfferPrefix && mobileOfferSeconds && mobileOfferCountdown) {
        mobileOfferPrefix.textContent = formatted.prefix;
        mobileOfferSeconds.textContent = formatted.seconds;
        mobileOfferCountdown.setAttribute(
          "aria-label",
          `Tiempo restante de la oferta: ${formatted.text}`
        );
        if (formatted.seconds !== previousMobileSecond && !reducedMotion.matches) {
          mobileOfferSeconds.classList.remove("is-pulsing");
          void mobileOfferSeconds.offsetWidth;
          mobileOfferSeconds.classList.add("is-pulsing");
        }
        previousMobileSecond = formatted.seconds;
      }
      if (offerCountdown) {
        offerCountdown.setAttribute(
          "aria-label",
          `Tiempo restante de la oferta: ${formatted.text}`
        );
      }
      setOfferState("active");
    }
    function startOfferTimer() {
      stopOfferTimer();
      offerExpiresAt = getOrCreateOfferExpiry();
      renderOfferCountdown();
      if (!document.hidden && offerExpiresAt && offerExpiresAt > Date.now()) {
        offerTimerId = window.setInterval(renderOfferCountdown, 1e3);
      }
    }
    function resumeOfferTimer() {
      if (document.hidden) return;
      renderOfferCountdown();
      if (offerExpiresAt && offerExpiresAt > Date.now() && offerTimerId === null) {
        offerTimerId = window.setInterval(renderOfferCountdown, 1e3);
      }
    }
    startOfferTimer();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopOfferTimer();
      } else {
        resumeOfferTimer();
      }
    });
    window.addEventListener("pageshow", () => {
      resumeOfferTimer();
    });
    window.addEventListener("pagehide", stopOfferTimer);
    window.addEventListener("storage", (event) => {
      if (event.key !== OFFER_STORAGE_KEY || event.newValue === null) return;
      const deadline = Number(event.newValue);
      if (!Number.isFinite(deadline) || deadline <= 0) return;
      offerExpiresAt = Math.min(offerExpiresAt ?? deadline, deadline);
      if (!document.hidden) resumeOfferTimer();
    });
  }

  // js/price-anchor.js
  var initialized7 = false;
  function initPriceAnchor() {
    if (initialized7) return;
    initialized7 = true;
    const moneyCounterElements = [
      ...document.querySelectorAll("[data-money-counter]")
    ];
    const moneySeparator = document.querySelector("[data-money-separator]");
    const moneyFigures = [...document.querySelectorAll(".money-figure")];
    const prefersReducedMotionForCounters = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    function formatMoneyCounter(value) {
      return Number(value).toLocaleString("es-MX");
    }
    function animateMoneyCounter(element, duration = 1050) {
      return new Promise((resolve) => {
        if (!element || element.dataset.counterDone === "true") {
          resolve();
          return;
        }
        const target = Number(element.dataset.moneyCounter || "0");
        if (!Number.isFinite(target) || target <= 0 || prefersReducedMotionForCounters) {
          element.textContent = formatMoneyCounter(target || 0);
          element.dataset.counterDone = "true";
          resolve();
          return;
        }
        const startedAt = performance.now();
        const frame = (now) => {
          const progress = Math.min((now - startedAt) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          element.textContent = formatMoneyCounter(Math.round(target * eased));
          if (progress < 1) {
            requestAnimationFrame(frame);
          } else {
            element.textContent = formatMoneyCounter(target);
            element.dataset.counterDone = "true";
            resolve();
          }
        };
        requestAnimationFrame(frame);
      });
    }
    function revealMoneyNode(node) {
      if (!node) return;
      node.classList.add("is-money-visible");
    }
    function wait(ms) {
      return new Promise((resolve) => window.setTimeout(resolve, ms));
    }
    async function runMoneySequence() {
      const [firstCounter, secondCounter] = moneyCounterElements;
      const [firstFigure, secondFigure] = moneyFigures;
      if (!firstCounter || !secondCounter || !firstFigure || !secondFigure)
        return;
      if (firstCounter.dataset.sequencePlayed === "true") return;
      firstCounter.dataset.sequencePlayed = "true";
      if (prefersReducedMotionForCounters) {
        moneyFigures.forEach(revealMoneyNode);
        revealMoneyNode(moneySeparator);
        moneyCounterElements.forEach((element) => {
          element.textContent = formatMoneyCounter(
            Number(element.dataset.moneyCounter || "0")
          );
          element.dataset.counterDone = "true";
        });
        return;
      }
      firstCounter.textContent = "0";
      revealMoneyNode(firstFigure);
      await animateMoneyCounter(firstCounter, 1100);
      await wait(180);
      revealMoneyNode(moneySeparator);
      await wait(260);
      secondCounter.textContent = "0";
      revealMoneyNode(secondFigure);
      await animateMoneyCounter(secondCounter, 1250);
    }
    function initMoneyCounters() {
      if (moneyCounterElements.length < 2) return;
      if (prefersReducedMotionForCounters) {
        runMoneySequence();
        return;
      }
      const anchorSection = document.getElementById("ancla-precio");
      if (!anchorSection) return;
      if (!("IntersectionObserver" in window)) {
        runMoneySequence();
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry?.isIntersecting) return;
          runMoneySequence();
          observer.disconnect();
        },
        {
          threshold: 0,
          rootMargin: "0px 0px -8% 0px"
        }
      );
      observer.observe(moneyFigures[0] || anchorSection);
    }
    initMoneyCounters();
  }

  // js/sticky-mobile.js
  var initialized8 = false;
  function initStickyMobile() {
    if (initialized8) return;
    initialized8 = true;
    const mobileOfferBar = document.querySelector("[data-mobile-offer-bar]");
    const purchasePanel = document.querySelector("[data-offer-panel]");
    const siteFooter = document.querySelector(".site-footer");
    const header = document.querySelector("[data-header]");
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
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const stickyHeight = getMobileOfferVisualHeight();
      const collisionLine = viewportHeight - stickyHeight - MOBILE_STICKY_GAP;
      return rect.top <= collisionLine && rect.bottom >= MOBILE_STICKY_GAP;
    }
    function isFooterVisible() {
      if (!siteFooter || !isMobileOfferViewport()) return false;
      const rect = siteFooter.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
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
        purchaseCollision
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
      passive: true
    });
    window.addEventListener("resize", scheduleMobileOfferBarVisibilityUpdate);
    window.addEventListener(
      "orientationchange",
      scheduleMobileOfferBarVisibilityUpdate
    );
    window.addEventListener("pageshow", scheduleMobileOfferBarVisibilityUpdate);
    updateMobileOfferBarVisibility();
  }

  // js/purchase-box.js
  var initialized9 = false;
  function initPurchaseBox() {
    if (initialized9) return;
    initialized9 = true;
    const checkoutUrl = typeof CONFIG.payhipCheckoutUrl === "string" ? CONFIG.payhipCheckoutUrl.trim() : "";
    document.querySelectorAll("[data-checkout-link]").forEach((link) => {
      if (checkoutUrl) {
        link.href = checkoutUrl;
        link.rel = "noopener";
      }
    });
    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-checkout-link], [data-track-cta]");
      if (!link) return;
      const location2 = link.dataset.ctaLocation || "unknown";
      analytics.ctaClick(location2);
      if (!link.hasAttribute("data-checkout-link")) return;
      if (checkoutUrl) analytics.checkoutStart(location2);
      else if (location2 === "offer") event.preventDefault();
    });
    const paymentMethods = Array.isArray(CONFIG.paymentMethods) ? CONFIG.paymentMethods.map((method) => String(method).trim().toLowerCase()).filter(Boolean) : [];
    const paymentContainer = document.querySelector("[data-payment-methods]");
    if (paymentContainer) {
      const badges = [
        ...paymentContainer.querySelectorAll("[data-payment-method]")
      ];
      const enabled = new Set(paymentMethods);
      badges.forEach((badge) => {
        const key = String(badge.dataset.paymentMethod || "").toLowerCase();
        badge.hidden = enabled.size > 0 && !enabled.has(key);
      });
      paymentContainer.hidden = !badges.some((badge) => !badge.hidden);
    }
  }

  // js/vsl.js
  var initialized10 = false;
  function initVsl() {
    if (initialized10) return;
    initialized10 = true;
    const videoFrame = document.querySelector("[data-video-frame]");
    const placeholderPlay = document.querySelector("[data-placeholder-play]");
    const bunnySrc = typeof CONFIG.bunnyStreamEmbedUrl === "string" ? CONFIG.bunnyStreamEmbedUrl.trim() : "";
    let videoHasStarted = false;
    if (videoFrame && bunnySrc) {
      const iframe = document.createElement("iframe");
      iframe.src = bunnySrc;
      iframe.title = "Video de 60 segundos sobre c\xF3mo evaluar si te conviene franquiciar tu negocio";
      iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.loading = "eager";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      videoFrame.replaceChildren(iframe);
    }
    placeholderPlay?.addEventListener("click", () => {
      if (!videoHasStarted) {
        videoHasStarted = true;
        analytics.videoStart();
      }
      if (!prefersReducedMotion) {
        placeholderPlay.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(.93)" },
            { transform: "scale(1)" }
          ],
          { duration: 340, easing: "cubic-bezier(.16,1,.3,1)" }
        );
      }
    });
    window.addEventListener("message", (event) => {
      if (!bunnySrc || event.source !== videoFrame?.querySelector("iframe")?.contentWindow)
        return;
      let origin;
      try {
        origin = new URL(bunnySrc, location.href).origin;
      } catch {
        return;
      }
      if (event.origin !== origin) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const type = String(data.type || data.event || "").toLowerCase();
      if (type.includes("play") || type.includes("start")) {
        if (!videoHasStarted) {
          videoHasStarted = true;
          analytics.videoStart();
        }
      }
      if (type.includes("ended") || type.includes("complete")) {
        analytics.videoComplete();
      }
    });
  }

  // js/faq.js
  var initialized11 = false;
  function initFaq() {
    if (initialized11) return;
    initialized11 = true;
    function initFaqMotion() {
      const items = [...document.querySelectorAll(".purchase-faq details")];
      if (!items.length || prefersReducedMotion || typeof Element.prototype.animate !== "function")
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
              { height: "0px", opacity: 0 }
            ],
            {
              duration: 190,
              easing: "cubic-bezier(.4,0,.2,1)"
            }
          );
          animation.onfinish = () => {
            details.open = false;
            cleanup();
          };
          animation.oncancel = cleanup;
        };
        const open = () => {
          const startHeight = details.open ? answer.getBoundingClientRect().height : 0;
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
              { height: endHeight, opacity: 1 }
            ],
            {
              duration: 230,
              easing: "cubic-bezier(.16,1,.3,1)"
            }
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
          if (isClosing || !details.open && !isExpanding) {
            open();
          } else if (isExpanding || details.open) {
            close();
          }
        });
      });
    }
    initFaqMotion();
  }

  // js/price-reel.js
  var initialized12 = false;
  function initPriceReel() {
    if (initialized12) return;
    initialized12 = true;
    const price = document.querySelector("[data-ofr-price]");
    const amount = document.querySelector("[data-ofr-amount]");
    const fig = amount && amount.querySelector(".ofr-fig");
    const num = fig && fig.querySelector(".ofr-num");
    if (!price || !amount || !fig || !num) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canAnimate = typeof Element.prototype.animate === "function" && "IntersectionObserver" in window;
    const value = 349;
    const anchorValue = 999;
    const currency = "$";
    const intPart = (n) => String(Math.floor(n));
    const finalDigits = intPart(value).split("");
    const startDigits = intPart(anchorValue).split("");
    const curEl = fig.querySelector(".ofr-cur");
    const centsEl = fig.querySelector(".ofr-cents");
    const sr = amount.querySelector(".ofr-sr");
    if (curEl) curEl.setAttribute("data-t", currency);
    if (centsEl) {
      centsEl.setAttribute("data-t", "");
      centsEl.hidden = true;
    }
    if (sr) sr.textContent = "$349 MXN";
    const reelHTML = (d) => `<span class="ofr-reel" data-d="${d}"><span class="ofr-strip"><span class="ofr-cell" data-d="${d}"></span></span></span>`;
    num.innerHTML = finalDigits.map(reelHTML).join("");
    const reels = num.querySelectorAll(":scope > .ofr-reel");
    if (!canAnimate) return;
    const run = (from, count) => Array.from(
      { length: count },
      (_, i) => String(((from - i) % 10 + 10) % 10)
    );
    const cell = (d) => {
      const c = document.createElement("span");
      c.className = "ofr-cell";
      c.setAttribute("data-d", d || " ");
      return c;
    };
    const turnsAt = (p) => p === 0 ? 3 : p === 1 ? 2 : 1;
    const durAt = (p) => p === 0 ? 1950 : p === 1 ? 1450 : 1e3;
    const mk = (reel, seq, fin, p) => ({
      reel,
      strip: reel.querySelector(".ofr-strip"),
      seq,
      fin,
      k: seq.length - 1,
      dur: durAt(p)
    });
    const all = [];
    const total = startDigits.length;
    for (let i = 0; i < total; i++) {
      const p = total - 1 - i;
      const s = Number(startDigits[i]);
      const fd = finalDigits[i];
      const steps = (s - Number(fd) + 10) % 10 + 10 * turnsAt(p);
      all.push(mk(reels[i], [String(s), ...run(s - 1, steps)], fd, p));
    }
    const longest = Math.max(...all.map((r) => r.dur));
    function fill(r) {
      r.strip.textContent = "";
      for (let i = r.seq.length - 1; i >= 0; i--) {
        r.strip.appendChild(cell(r.seq[i]));
      }
    }
    function collapse(r) {
      r.strip.textContent = "";
      if (r.fin) r.strip.appendChild(cell(r.fin));
      r.strip.style.transform = "";
    }
    let state = "idle";
    let inView = false;
    let timers = [];
    let anims = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const pos = (r, p) => `translateY(${(p - r.k).toFixed(3)}em)`;
    function clearAll() {
      timers.forEach(clearTimeout);
      timers = [];
      anims.forEach((a) => a.cancel());
      anims = [];
    }
    function spin(r, dur, delay, blurPx) {
      const wind = 0.16;
      const tail = 3;
      const slope = 1.45 / 0.2;
      const tw = 150;
      const lead = r.k - tail + wind;
      const rest = dur - tw;
      const ta = rest / (1 + slope * tail / (2 * lead));
      const tb = rest - ta;
      anims.push(
        r.strip.animate(
          [
            { transform: pos(r, 0), easing: "cubic-bezier(.3,0,.5,1)" },
            {
              transform: pos(r, -wind),
              offset: tw / dur,
              easing: "cubic-bezier(.5,0,1,1)"
            },
            {
              transform: pos(r, r.k - tail),
              offset: (tw + ta) / dur,
              easing: "cubic-bezier(.2,1.45,.5,1)"
            },
            { transform: pos(r, r.k) }
          ],
          {
            duration: dur,
            delay,
            fill: "both"
          }
        )
      );
      anims.push(
        r.reel.animate(
          [
            { filter: "blur(0px)" },
            { filter: `blur(${blurPx}px)`, offset: (tw + ta * 0.3) / dur },
            { filter: `blur(${blurPx}px)`, offset: (tw + ta) / dur },
            {
              filter: "blur(0px)",
              offset: Math.min(1, (tw + ta + tb * 0.45) / dur)
            },
            { filter: "blur(0px)" }
          ],
          {
            duration: dur,
            delay
          }
        )
      );
    }
    function arm() {
      clearAll();
      amount.classList.remove("is-hit");
      all.forEach((r) => {
        fill(r);
        r.strip.style.transform = pos(r, 0);
      });
      void fig.offsetWidth;
      state = "armed";
    }
    function finish() {
      clearAll();
      all.forEach(collapse);
    }
    function play() {
      if (state !== "armed") return;
      state = "running";
      io.disconnect();
      const blur = Math.max(
        2,
        parseFloat(getComputedStyle(amount).fontSize) * 0.028
      );
      const delay = 260;
      all.forEach((r) => spin(r, r.dur, delay, blur));
      later(
        () => {
          amount.classList.remove("is-hit");
          void amount.offsetWidth;
          amount.classList.add("is-hit");
        },
        delay + longest - 60
      );
      later(
        () => {
          finish();
          state = "done";
        },
        delay + longest + 1350
      );
    }
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        inView = e.isIntersecting;
        if (reduce.matches) return;
        if (e.isIntersecting && e.intersectionRatio >= 0.55 && state === "armed") {
          play();
        }
      },
      {
        threshold: [0, 0.55, 1]
      }
    );
    function setMode() {
      if (reduce.matches) {
        finish();
        amount.classList.remove("is-hit");
        state = "static";
      } else if (state === "static" || state === "idle") {
        if (inView && state === "static") {
          state = "done";
        } else {
          arm();
        }
      }
    }
    setMode();
    io.observe(price);
    if (reduce.addEventListener) {
      reduce.addEventListener("change", setMode);
    } else if (reduce.addListener) {
      reduce.addListener(setMode);
    }
  }

  // js/bootstrap.js
  var bootstrapKey = /* @__PURE__ */ Symbol.for("ltf.landing.bootstrapped");
  function initApp() {
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
})();
