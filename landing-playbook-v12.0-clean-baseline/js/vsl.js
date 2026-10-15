let initialized = false;

import Hls from "./vendor/hls.light.mjs";
import { analytics } from "./shared.js";

// Bunny Stream library 780085, video 7b2bbd93-26c7-450f-8c58-3f3c99139b43.
const BUNNY_HLS_URL =
  "https://vz-d4744015-b5b.b-cdn.net/7b2bbd93-26c7-450f-8c58-3f3c99139b43/playlist.m3u8";

export function initVsl() {
  if (initialized) return;
  const frame = document.querySelector(
    "[data-video-frame], #video .video-frame",
  );
  if (!frame) return;
  initialized = true;
  frame.dataset.vslVersion = "audio-reset-2";

  const video = document.createElement("video");
  video.className = "vsl-video";
  video.setAttribute(
    "aria-label",
    "Video sobre cómo evaluar si te conviene franquiciar tu negocio",
  );
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("disablepictureinpicture", "");
  video.setAttribute("disableremoteplayback", "");
  video.setAttribute("x-webkit-airplay", "deny");
  video.setAttribute(
    "controlslist",
    "nodownload nofullscreen noremoteplayback noplaybackrate",
  );
  video.tabIndex = -1;
  video.controls = false;
  video.autoplay = true;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.disablePictureInPicture = true;
  video.disableRemotePlayback = true;
  video.preload = "auto";

  const gate = document.createElement("button");
  gate.type = "button";
  gate.className = "vsl-audio-gate";
  gate.setAttribute("data-placeholder-play", "");
  gate.innerHTML =
    '<span class="vsl-audio-card"><span class="vsl-audio-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg></span><strong>Cargando video</strong><span>Haz clic para escuchar</span></span>';
  const gateTitle = gate.querySelector("strong");

  const controls = document.createElement("div");
  controls.className = "vsl-controls";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "vsl-play-pause";
  toggle.setAttribute("aria-label", "Reproducir video");
  toggle.innerHTML =
    '<svg class="vsl-play-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7V5Z"/></svg><svg class="vsl-pause-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  const progress = document.createElement("div");
  progress.className = "vsl-progress";
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", "Progreso del video");
  progress.setAttribute("aria-valuemin", "0");
  progress.setAttribute("aria-valuemax", "100");
  progress.setAttribute("aria-valuenow", "0");
  const fill = document.createElement("span");
  progress.append(fill);
  controls.append(toggle, progress);
  frame.replaceChildren(video, gate, controls);

  let hls = null;
  let started = false;
  let complete = false;
  let audioEnabled = false;
  let failed = false;
  let resumeAfterPageShow = false;
  let acceptedTime = 0;
  let restoringSeek = false;
  let restartingForAudio = false;
  let sourceGeneration = 0;
  const seekTolerance = 0.12;

  // Only playback may advance the trusted position, never a seeking event.
  function rememberPlaybackPosition() {
    if (!video.seeking && !restoringSeek && !restartingForAudio) {
      acceptedTime = video.currentTime;
    }
  }
  if (typeof video.requestVideoFrameCallback === "function") {
    const rememberFrame = () => {
      rememberPlaybackPosition();
      video.requestVideoFrameCallback(rememberFrame);
    };
    video.requestVideoFrameCallback(rememberFrame);
  }
  video.addEventListener("timeupdate", rememberPlaybackPosition);
  video.addEventListener("pause", rememberPlaybackPosition);
  video.addEventListener("seeking", () => {
    if (
      restartingForAudio ||
      restoringSeek ||
      Math.abs(video.currentTime - acceptedTime) <= seekTolerance
    )
      return;
    restoringSeek = true;
    video.currentTime = acceptedTime;
  });
  video.addEventListener("seeked", () => {
    restoringSeek = false;
  });
  frame.addEventListener(
    "keydown",
    (event) => {
      if (
        event.target.closest(".vsl-controls, .vsl-audio-gate, .vsl-video") &&
        ["ArrowLeft", "ArrowRight", "Home", "End", "KeyJ", "KeyL"].includes(
          event.code,
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );
  frame.addEventListener("contextmenu", (event) => event.preventDefault());
  new MutationObserver(() => {
    if (video.controls) video.controls = false;
  }).observe(video, { attributes: true, attributeFilter: ["controls"] });

  function showBlocked() {
    gate.hidden = false;
    gateTitle.textContent = "Reproducir video";
    gate.setAttribute("aria-label", "Reproducir video con sonido");
  }

  function updatePlayback() {
    const playing = !video.paused && !video.ended;
    toggle.classList.toggle("is-playing", playing);
    toggle.setAttribute(
      "aria-label",
      playing ? "Pausar video" : "Reproducir video",
    );
  }

  function updateProgress() {
    const fraction =
      Number.isFinite(video.duration) && video.duration > 0
        ? Math.min(1, Math.max(0, video.currentTime / video.duration))
        : 0;
    fill.style.transform = `scaleX(${fraction})`;
    progress.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
  }

  function startPlayback() {
    // Explicit replay after completion is allowed; scrubbing during playback is not.
    if (video.ended) acceptedTime = 0;
    const generation = sourceGeneration;
    const request = video.play();
    request?.catch((error) => {
      if (generation !== sourceGeneration || error?.name === "AbortError")
        return;
      if (!failed) showBlocked();
      updatePlayback();
    });
  }

  function showError() {
    failed = true;
    gateTitle.textContent = "Reintentar video";
    gate.setAttribute("aria-label", "Reintentar reproducción del video");
    gate.hidden = false;
    updatePlayback();
  }

  function loadSource(reset = false) {
    const generation = ++sourceGeneration;
    failed = false;
    hls?.destroy();
    hls = null;
    if (reset) {
      // Drop the previous media pipeline as well as its playback position.
      video.removeAttribute("src");
      video.load();
      acceptedTime = 0;
      restoringSeek = false;
      updateProgress();
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = BUNNY_HLS_URL;
      startPlayback();
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, startPosition: 0 });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (generation === sourceGeneration && data.fatal) showError();
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (generation === sourceGeneration) startPlayback();
      });
      hls.loadSource(BUNNY_HLS_URL);
      hls.attachMedia(video);
    } else {
      showError();
    }
  }

  gate.addEventListener("click", () => {
    restartingForAudio = true;
    video.pause();
    video.defaultMuted = false;
    video.muted = false;
    video.volume = 1;
    audioEnabled = true;
    gate.hidden = true;
    loadSource(true);
  });
  toggle.addEventListener("click", () => {
    if (video.paused || video.ended) startPlayback();
    else video.pause();
  });
  video.addEventListener("playing", () => {
    if (video.paused || video.readyState < 2) return;
    if (restartingForAudio) {
      restartingForAudio = false;
      acceptedTime = video.currentTime;
    }
    updatePlayback();
    if (!audioEnabled) {
      gateTitle.textContent = "El video ya comenzó";
      gate.setAttribute("aria-label", "Haz clic para escuchar");
      gate.hidden = false;
    }
    if (!started) {
      started = true;
      analytics.videoStart();
    }
  });
  video.addEventListener("pause", updatePlayback);
  video.addEventListener("timeupdate", updateProgress);
  video.addEventListener("durationchange", updateProgress);
  video.addEventListener("error", showError);
  video.addEventListener("ended", () => {
    updatePlayback();
    updateProgress();
    if (!complete) {
      complete = true;
      analytics.videoComplete();
    }
  });
  window.addEventListener("pagehide", () => {
    resumeAfterPageShow = !video.paused;
    video.pause();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && resumeAfterPageShow) startPlayback();
  });

  updatePlayback();
  updateProgress();
  loadSource();
}
