let initialized = false;

export function initTracking() {
  if (initialized) return;
  initialized = true;

  const TRACKING_CONFIG = {
    metaPixelId: "",
    tiktokPixelId: "",
    consentGranted: false,
    debug: false,
  };

  const state = {
    metaLoaded: false,
    tiktokLoaded: false,
  };

  const log = (...args) => {
    if (TRACKING_CONFIG.debug) console.info("[LTFTracking]", ...args);
  };

  function loadMetaPixel() {
    if (state.metaLoaded || !TRACKING_CONFIG.metaPixelId) return;

    /* Meta Pixel base loader. It stays dormant until consent is granted. */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js",
    );

    fbq("init", TRACKING_CONFIG.metaPixelId);
    fbq("track", "PageView");
    state.metaLoaded = true;
    log("Meta Pixel loaded");
  }

  function loadTikTokPixel() {
    if (state.tiktokLoaded || !TRACKING_CONFIG.tiktokPixelId) return;

    /* TikTok Pixel base loader. It stays dormant until consent is granted. */
    !(function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      var ttq = (w[t] = w[t] || []);
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
        "grantConsent",
      ];
      ttq.setAndDefer = function (t, e) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (var i = 0; i < ttq.methods.length; i++)
        ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (t) {
        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
          ttq.setAndDefer(e, ttq.methods[n]);
        return e;
      };
      ttq.load = function (e, n) {
        var r = "https://analytics.tiktok.com/i18n/pixel/events.js",
          o = n && n.partner;
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = r;
        ttq._t = ttq._t || {};
        ttq._t[e] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = n || {};
        var a = document.createElement("script");
        a.type = "text/javascript";
        a.async = !0;
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

    /* Internal dataLayer hook for GA4/GTM if added later. */
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
        VideoComplete: "ViewContent",
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
        VideoComplete: "ViewContent",
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
    loadAdvertisingPixels,
  };

  loadAdvertisingPixels();
}
