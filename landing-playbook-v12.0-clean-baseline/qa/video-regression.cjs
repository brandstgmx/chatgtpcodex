const { chromium } = require("playwright");
const fs = require("fs"),
  path = require("path");
const base = process.env.APP_URL || "http://127.0.0.1:8781/";
const cp = require("child_process");
const originalApp = cp.execFileSync(
  "git",
  [
    "show",
    "7abb21a2da0ecf021fdbaa51b54917b07d510096:landing-playbook-v12.0-clean-baseline/js/app.js",
  ],
  { cwd: path.resolve(__dirname, "../..") },
);
const originalCss = cp.execFileSync(
  "git",
  [
    "show",
    "7abb21a2da0ecf021fdbaa51b54917b07d510096:landing-playbook-v12.0-clean-baseline/css/vsl.css",
  ],
  { cwd: path.resolve(__dirname, "../..") },
);
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const results = [];
  const viewports = process.env.QA_VIEWPORTS
    ? JSON.parse(process.env.QA_VIEWPORTS)
    : [
        [360, 800],
        [390, 844],
        [430, 932],
        [768, 1024],
        [1024, 768],
        [1366, 768],
        [1440, 900],
        [1920, 1080],
      ];
  for (const [width, height] of viewports) {
    const context = await b.newContext({
      viewport: { width, height },
      hasTouch: width < 641,
      isMobile: width < 641,
    });
    if (process.env.VSL_FORCE_MSE === "1")
      await context.addInitScript(() => {
        const original = HTMLMediaElement.prototype.canPlayType;
        HTMLMediaElement.prototype.canPlayType = function (type) {
          return /mpegurl/i.test(type) ? "" : original.call(this, type);
        };
      });
    const baseline = await context.newPage();
    await baseline.route("**/js/app*.js", (r) =>
      r.fulfill({ contentType: "text/javascript", body: originalApp }),
    );
    await baseline.route("**/css/vsl.css", (r) =>
      r.fulfill({ contentType: "text/css", body: originalCss }),
    );
    await baseline.goto(base);
    await baseline.waitForTimeout(1300);
    const original = await baseline.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      frame: document
        .querySelector("[data-video-frame]")
        .getBoundingClientRect()
        .toJSON(),
      radius: getComputedStyle(document.querySelector("[data-video-frame]"))
        .borderRadius,
      sections: [...document.querySelectorAll("main>section")]
        .filter((e) => e.id !== "video")
        .map((e) => {
          const clone = e.cloneNode(true);
          clone
            .querySelectorAll("[data-offer-countdown]")
            .forEach((n) => n.remove());
          clone
            .querySelectorAll("[data-money-counter]")
            .forEach((n) => (n.textContent = n.dataset.moneyCounter));
          return clone.textContent.replace(/\s+/g, " ").trim();
        }),
    }));
    await baseline.close();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.route(
      "https://vz-d4744015-b5b.b-cdn.net/7b2bbd93-26c7-450f-8c58-3f3c99139b43/**",
      (r) => {
        const name = new URL(r.request().url()).pathname.split("/").pop();
        const file = path.join(
          process.env.HLS_FIXTURE_DIR || "/tmp/vsl-qa-fixture",
          name,
        );
        return r.fulfill({
          headers: { "Access-Control-Allow-Origin": "*" },
          contentType: name.endsWith(".m3u8")
            ? "application/vnd.apple.mpegurl"
            : "video/mp2t",
          body: fs.readFileSync(file),
        });
      },
    );
    await page.goto(base);
    await page.locator("[data-video-frame]").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const v = document.querySelector(".vsl-video");
      return v && !v.paused && v.currentTime > 1.1 && v.duration > 0;
    });
    await page.locator("[data-video-frame]").scrollIntoViewIfNeeded();
    await page.waitForTimeout(450);
    const initial = await page.locator(".vsl-video").evaluate((v) => ({
      time: v.currentTime,
      muted: v.muted,
      controls: v.controls,
      pip: v.disablePictureInPicture,
      remote: v.disableRemotePlayback,
      inline: v.playsInline,
    }));
    const title = await page.locator(".vsl-audio-card strong").textContent();
    const oldSource = await page.locator("video").evaluate((v) => v.currentSrc);
    await page.locator("video").evaluate((v) => {
      window.__reloadEvents = [];
      for (const event of ["emptied", "loadstart"])
        v.addEventListener(event, () => window.__reloadEvents.push(event));
      window.__audioFrames = [];
      v.addEventListener("playing", () =>
        window.__audioFrames.push({
          time: v.currentTime,
          muted: v.muted,
          ready: v.readyState,
        }),
      );
    });
    const centered = await page.locator("[data-video-frame]").evaluate((e) => {
      const frame = e.getBoundingClientRect(),
        card = e.querySelector(".vsl-audio-card").getBoundingClientRect(),
        controls = e.querySelector(".vsl-controls").getBoundingClientRect();
      return (
        Math.abs(
          (frame.top + frame.bottom) / 2 - (card.top + card.bottom) / 2,
        ) < 1 &&
        Math.abs(
          (frame.left + frame.right) / 2 - (card.left + card.right) / 2,
        ) < 1 &&
        card.bottom <= controls.top
      );
    });
    await page.locator(".vsl-audio-gate").click();
    await page.waitForFunction(() => {
      const v = document.querySelector(".vsl-video");
      return (
        v &&
        !v.muted &&
        !v.paused &&
        !v.seeking &&
        v.readyState >= 2 &&
        v.currentTime > 0 &&
        v.currentTime < 0.8 &&
        window.__audioFrames.some(
          (f) => !f.muted && f.ready >= 2 && f.time < 0.8,
        )
      );
    });
    const audible = await page.locator(".vsl-video").evaluate((v) => ({
      time: v.currentTime,
      muted: v.muted,
      playing: !v.paused,
      source: v.currentSrc,
      frames: window.__audioFrames,
      reloads: window.__reloadEvents,
    }));
    const gateHidden = await page
      .locator(".vsl-audio-gate")
      .evaluate((e) => e.hidden);
    await page.waitForFunction(
      () => document.querySelector(".vsl-video").currentTime > 1.2,
    );
    await page.locator(".vsl-play-pause").click();
    await page.waitForFunction(
      () => document.querySelector(".vsl-video").paused,
    );
    const paused = await page
      .locator(".vsl-video")
      .evaluate((v) => v.currentTime);
    await page
      .locator(".vsl-video")
      .evaluate(
        (v) => (v.currentTime = Math.min(v.duration - 1, v.currentTime + 6)),
      );
    await page.waitForFunction((t) => {
      const v = document.querySelector(".vsl-video");
      return !v.seeking && Math.abs(v.currentTime - t) < 0.15;
    }, paused);
    const forwardBlocked = true;
    await page.locator(".vsl-video").evaluate((v) => (v.currentTime = 0));
    await page.waitForFunction((t) => {
      const v = document.querySelector(".vsl-video");
      return !v.seeking && Math.abs(v.currentTime - t) < 0.15;
    }, paused);
    const backwardBlocked = true;
    const r = await page.locator(".vsl-progress").boundingBox();
    await page.mouse.click(r.x + r.width * 0.95, r.y + r.height / 2);
    await page.mouse.move(r.x + 3, r.y + r.height / 2);
    await page.mouse.down();
    await page.mouse.move(r.x + r.width, r.y + r.height / 2, { steps: 8 });
    await page.mouse.up();
    const noSeek = await page
      .locator(".vsl-video")
      .evaluate((v, t) => Math.abs(v.currentTime - t) < 0.01, paused);
    await page.locator(".vsl-play-pause").click();
    await page.waitForFunction(
      () => !document.querySelector(".vsl-video").paused,
    );
    const layout = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      frame: document
        .querySelector("[data-video-frame]")
        .getBoundingClientRect()
        .toJSON(),
      radius: getComputedStyle(document.querySelector("[data-video-frame]"))
        .borderRadius,
      sections: [...document.querySelectorAll("main>section")]
        .filter((e) => e.id !== "video")
        .map((e) => {
          const clone = e.cloneNode(true);
          clone
            .querySelectorAll("[data-offer-countdown]")
            .forEach((n) => n.remove());
          clone
            .querySelectorAll("[data-money-counter]")
            .forEach((n) => (n.textContent = n.dataset.moneyCounter));
          return clone.textContent.replace(/\s+/g, " ").trim();
        }),
      controls: document.querySelectorAll(".vsl-controls button").length,
      progress: Number(
        document
          .querySelector("[role=progressbar]")
          .getAttribute("aria-valuenow"),
      ),
    }));
    const sectionsSame = layout.sections.every(
      (s, i) => s === original.sections[i],
    );
    let heights = [];
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => scrollTo({ top: 1e8, behavior: "instant" }));
      await page.waitForTimeout(30);
      heights.push(
        await page.evaluate(() => document.documentElement.scrollHeight),
      );
    }
    const footerSticky = await page
      .locator("[data-mobile-offer-bar]")
      .evaluate((e) => !e.classList.contains("is-visible"));
    const timer = await page.evaluate(() => ({
      active: document.querySelector("[data-offer-status]").dataset.offerState,
      main: document.querySelector("[data-offer-countdown]").textContent,
      mobile: document.querySelector("[data-mobile-offer-countdown]")
        .textContent,
    }));
    const pass =
      forwardBlocked &&
      backwardBlocked &&
      centered &&
      !errors.length &&
      initial.muted &&
      !initial.controls &&
      initial.pip &&
      initial.remote &&
      initial.inline &&
      title === "El video ya comenzó" &&
      !audible.muted &&
      audible.playing &&
      audible.reloads.includes("emptied") &&
      audible.reloads.includes("loadstart") &&
      audible.frames.some((f) => !f.muted && f.time < 0.8) &&
      audible.time < 0.8 &&
      initial.time > 1.1 &&
      gateHidden &&
      noSeek &&
      layout.height === original.height &&
      Math.abs(layout.frame.height - original.frame.height) < 1 &&
      layout.radius === original.radius &&
      sectionsSame &&
      layout.controls === 1 &&
      layout.progress > 0 &&
      new Set(heights).size === 1 &&
      footerSticky &&
      timer.active === "active" &&
      timer.main.replace(/\s/g, "") === timer.mobile.replace(/\s/g, "");
    results.push({
      width,
      height,
      initial,
      audible,
      title,
      forwardBlocked,
      backwardBlocked,
      centered,
      gateHidden,
      noSeek,
      originalHeight: original.height,
      currentHeight: layout.height,
      sectionsSame,
      footerSticky,
      timer,
      errors,
      pass,
    });
    console.log(pass ? "PASS" : "FAIL", width, height);
    if (!pass) console.log(JSON.stringify(results.at(-1)));
    await context.close();
  }
  await b.close();
  fs.writeFileSync(
    process.env.QA_OUTPUT_FILE ||
      path.join(
        __dirname,
        process.env.VSL_FORCE_MSE === "1"
          ? "video-regression-mse-results.json"
          : "video-regression-native-results.json",
      ),
    JSON.stringify(results, null, 2),
  );
  if (results.some((r) => !r.pass)) process.exitCode = 1;
})();
