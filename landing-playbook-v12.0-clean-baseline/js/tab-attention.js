let initialized = false;

export function initTabAttention() {
  if (initialized) return;
  initialized = true;

  const CONFIG = {
    enabled: true,
    minimumDwellMs: 8000,
    intervalMs: 1500,
    messages: ["👀 Espera… antes de irte", "📘 Tu Playbook te espera"],
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
    if (!CONFIG.enabled || !eligible || !document.hidden || timer !== null)
      return;

    index = 0;
    document.title = CONFIG.messages[index];

    timer = window.setInterval(() => {
      index = (index + 1) % CONFIG.messages.length;
      document.title = CONFIG.messages[index];
    }, CONFIG.intervalMs);
  }

  function updateEligibility() {
    if (eligibilityTimer !== null) {
      clearTimeout(eligibilityTimer);
      eligibilityTimer = null;
    }
    const elapsed = performance.now() - loadedAt;

    if (elapsed >= CONFIG.minimumDwellMs) {
      eligible = true;
      if (document.hidden) startAttention();
      return;
    }

    const remaining = Math.max(0, CONFIG.minimumDwellMs - elapsed);

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
    config: CONFIG,

    enable() {
      CONFIG.enabled = true;
      if (!eligible) updateEligibility();
      if (document.hidden) startAttention();
    },

    disable() {
      CONFIG.enabled = false;
      stopAttention();
    },

    test() {
      eligible = true;
      startAttention();
    },

    restore() {
      stopAttention();
    },
  };

  updateEligibility();
}
