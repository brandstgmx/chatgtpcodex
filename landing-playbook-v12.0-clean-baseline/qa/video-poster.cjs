const { chromium } = require("playwright");
const fs = require("fs"),
  path = require("path"),
  assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const width of process.env.QA_WIDTHS
      ? JSON.parse(process.env.QA_WIDTHS)
      : [360, 390, 430, 768, 1024, 1366, 1440, 1920]) {
      const p = await b.newPage({ viewport: { width, height: 900 } });
      if (process.env.VSL_NO_FRAME_CALLBACK === "1")
        await p.addInitScript(() => {
          HTMLVideoElement.prototype.requestVideoFrameCallback = undefined;
        });
      const errors = [],
        requests = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await p.route("https://vz-d4744015-b5b.b-cdn.net/**", async (r) => {
        const name = new URL(r.request().url()).pathname.split("/").pop();
        requests.push(name);
        await new Promise((resolve) =>
          setTimeout(resolve, name.endsWith(".m3u8") ? 700 : 300),
        );
        try {
          await r.fulfill({
            headers: { "Access-Control-Allow-Origin": "*" },
            contentType: name.endsWith(".m3u8")
              ? "application/vnd.apple.mpegurl"
              : "video/mp2t",
            body: fs.readFileSync(
              path.join(
                process.env.HLS_FIXTURE_DIR || "/tmp/vsl-qa-fixture",
                name,
              ),
            ),
          });
        } catch {}
      });
      await p.goto(process.env.APP_URL || "http://127.0.0.1:8783/");
      const height = await p.evaluate(
        () => document.documentElement.scrollHeight,
      );
      await p.locator("[data-video-frame]").scrollIntoViewIfNeeded();
      await p.waitForTimeout(400);
      const loading = await p.locator("[data-video-frame]").evaluate((e) => ({
        ready: e.classList.contains("is-video-ready"),
        opacity: getComputedStyle(e.querySelector("video")).opacity,
        posterVisibility: getComputedStyle(e.querySelector(".vsl-poster"))
          .visibility,
        cover:
          e.querySelector(".vsl-poster img").complete &&
          e.querySelector(".vsl-poster img").naturalWidth > 0,
        sameCover:
          e.querySelector(".vsl-poster img").src ===
          document.querySelector(".hero-product-clean__cover").src,
      }));
      assert.equal(loading.ready, false);
      assert.equal(loading.opacity, "0");
      assert.equal(loading.posterVisibility, "visible");
      assert.ok(loading.cover && loading.sameCover);
      if (width === 390 || width === 1440)
        await p
          .locator("[data-video-frame]")
          .screenshot({ path: `/tmp/vsl-poster-${width}.png` });
      await p.waitForFunction(
        () =>
          document
            .querySelector("[data-video-frame]")
            .classList.contains("is-video-ready") &&
          document.querySelector("video").currentTime > 0.3,
      );
      assert.equal(
        await p.locator("video").evaluate((v) => getComputedStyle(v).opacity),
        "1",
      );
      await p.waitForFunction(
        () => document.querySelector("video").currentTime > 0.8,
      );
      await p.locator(".vsl-audio-gate").click();
      assert.equal(
        await p
          .locator("[data-video-frame]")
          .evaluate((e) => e.classList.contains("is-video-ready")),
        false,
      );
      await p.waitForFunction(() => {
        const v = document.querySelector("video");
        return (
          document
            .querySelector("[data-video-frame]")
            .classList.contains("is-video-ready") &&
          !v.muted &&
          !v.paused &&
          v.currentTime < 0.8
        );
      });
      assert.equal(
        await p.evaluate(() => document.documentElement.scrollHeight),
        height,
      );
      assert.deepEqual(errors, []);
      assert.ok(
        requests.every((n) => n.endsWith(".m3u8") || n.endsWith(".ts")),
        "No CDN poster requests",
      );
      console.log(
        "PASS loading poster, first decoded frame, audio restart, no layout shift or Bunny image request:",
        width,
      );
      await p.close();
    }
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
