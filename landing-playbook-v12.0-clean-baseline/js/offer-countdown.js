let initialized = false;

import { prefersReducedMotion } from "./shared.js";

export function initOfferCountdown() {
  if (initialized) return;
  initialized = true;
  const OFFER_DURATION_MINUTES = 5;
  const OFFER_STORAGE_KEY = "ltf_offer_expires_at_v5";
  const offerStatus = document.querySelector("[data-offer-status]");
  const offerActive = document.querySelector("[data-offer-active]");
  const offerExpired = document.querySelector("[data-offer-expired]");
  const offerCountdown = document.querySelector("[data-offer-countdown]");
  const offerCountdownPrefix = document.querySelector(
    "[data-offer-countdown-prefix]",
  );
  const offerCountdownSeconds = document.querySelector(
    "[data-offer-countdown-seconds]",
  );

  const mobileOfferActive = document.querySelector(
    "[data-mobile-offer-active]",
  );
  const mobileOfferExpired = document.querySelector(
    "[data-mobile-offer-expired]",
  );
  const mobileOfferCountdown = document.querySelector(
    "[data-mobile-offer-countdown]",
  );
  const mobileOfferPrefix = document.querySelector(
    "[data-mobile-offer-prefix]",
  );
  const mobileOfferSeconds = document.querySelector(
    "[data-mobile-offer-seconds]",
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
        /* Try the next storage mechanism. */
      }
    }

    return null;
  }

  function getOrCreateOfferExpiry() {
    const durationMs =
      Math.max(0, Number(OFFER_DURATION_MINUTES) || 0) * 60 * 1000;
    const storage = getPersistentStorage();

    if (storage) {
      let stored = null;
      try {
        stored = storage.getItem(OFFER_STORAGE_KEY);
      } catch {
        /* Use fallback below. */
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
        /* Fall through to the in-memory timer. */
      }
    }

    /* Preview/file:// fallback. The timer still runs even when storage is blocked. */
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
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    if (hours > 0) {
      return {
        prefix: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
        seconds: String(seconds).padStart(2, "0"),
        text: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      };
    }

    const totalMinutes = Math.floor(safeSeconds / 60);
    return {
      prefix: String(totalMinutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
      text: `${String(totalMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    };
  }

  function setOfferState(state) {
    const isActive = state === "active";

    /* El timer principal puede no existir en algunas versiones cortas de la landing. */
    if (offerActive && offerExpired) {
      offerActive.hidden = !isActive;
      offerExpired.hidden = isActive;
    }

    if (offerStatus) {
      offerStatus.dataset.offerState = state;
      offerStatus.classList.remove("is-initializing");
    }

    /* El countdown mobile funciona de forma independiente. */
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

    const remainingSeconds = remainingMs / 1000;
    const formatted = formatOfferTime(remainingSeconds);

    if (offerCountdown) {
      if (offerCountdownPrefix && offerCountdownSeconds) {
        offerCountdownPrefix.textContent = formatted.prefix;
        offerCountdownSeconds.textContent = formatted.seconds;

        if (
          formatted.seconds !== previousDesktopSecond &&
          !prefersReducedMotion
        ) {
          previousDesktopSecond = formatted.seconds;
          offerCountdownSeconds.classList.remove("is-pulsing");
          void offerCountdownSeconds.offsetWidth;
          offerCountdownSeconds.classList.add("is-pulsing");
        }
      } else {
        offerCountdown.textContent = formatted.text;
      }
    }

    if (mobileOfferPrefix && mobileOfferSeconds && mobileOfferCountdown) {
      mobileOfferPrefix.textContent = formatted.prefix;
      mobileOfferSeconds.textContent = formatted.seconds;
      mobileOfferCountdown.setAttribute(
        "aria-label",
        `Tiempo restante de la oferta: ${formatted.text}`,
      );

      if (formatted.seconds !== previousMobileSecond && !prefersReducedMotion) {
        previousMobileSecond = formatted.seconds;
        mobileOfferSeconds.classList.remove("is-pulsing");
        void mobileOfferSeconds.offsetWidth;
        mobileOfferSeconds.classList.add("is-pulsing");
      }
    }

    if (offerCountdown) {
      offerCountdown.setAttribute(
        "aria-label",
        `Tiempo restante de la oferta: ${formatted.text}`,
      );
    }

    setOfferState("active");
  }

  function startOfferTimer() {
    stopOfferTimer();
    offerExpiresAt = getOrCreateOfferExpiry();
    renderOfferCountdown();

    if (!document.hidden && offerExpiresAt && offerExpiresAt > Date.now()) {
      offerTimerId = window.setInterval(renderOfferCountdown, 1000);
    }
  }

  function resumeOfferTimer() {
    /* Recalcula contra el timestamp absoluto ya guardado.
       No crea una nueva expiración si la oferta ya existía. */
    if (document.hidden) return;
    renderOfferCountdown();

    if (
      offerExpiresAt &&
      offerExpiresAt > Date.now() &&
      offerTimerId === null
    ) {
      offerTimerId = window.setInterval(renderOfferCountdown, 1000);
    }
  }

  startOfferTimer();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      /* No necesitamos contar en background: al volver se recalcula desde Date.now(). */
      stopOfferTimer();
    } else {
      resumeOfferTimer();
    }
  });

  window.addEventListener("pageshow", () => {
    /* Importante para BFCache: pagehide puede haber detenido el intervalo. */
    resumeOfferTimer();
  });

  window.addEventListener("pagehide", stopOfferTimer);

  // Another tab can establish an earlier deadline; never extend an existing offer.
  window.addEventListener("storage", (event) => {
    if (event.key !== OFFER_STORAGE_KEY || event.newValue === null) return;
    const deadline = Number(event.newValue);
    if (!Number.isFinite(deadline) || deadline <= 0) return;
    offerExpiresAt = Math.min(offerExpiresAt ?? deadline, deadline);
    if (!document.hidden) resumeOfferTimer();
  });
}
