let initialized = false;

import { CONFIG, prefersReducedMotion, analytics } from "./shared.js";

export function initVsl() {
  if (initialized) return;
  initialized = true;
  /* ---------------- Bunny Stream ---------------- */
  const videoFrame = document.querySelector("[data-video-frame]");
  const placeholderPlay = document.querySelector("[data-placeholder-play]");
  const bunnySrc =
    typeof CONFIG.bunnyStreamEmbedUrl === "string"
      ? CONFIG.bunnyStreamEmbedUrl.trim()
      : "";
  let videoHasStarted = false;

  if (videoFrame && bunnySrc) {
    const iframe = document.createElement("iframe");
    iframe.src = bunnySrc;
    iframe.title =
      "Video de 60 segundos sobre cómo evaluar si te conviene franquiciar tu negocio";
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
          { transform: "scale(1)" },
        ],
        { duration: 340, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    }
  });

  /* Acepta mensajes del reproductor Bunny si la integración/embed final los expone. */
  window.addEventListener("message", (event) => {
    if (
      !bunnySrc ||
      event.source !== videoFrame?.querySelector("iframe")?.contentWindow
    )
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
